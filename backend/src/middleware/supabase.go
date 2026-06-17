package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"webservices/src/pkg/common"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func SupbaseAuth() gin.HandlerFunc {
	secretKey := common.Env("SUPABASE_JWT_SECRET")

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}

		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}
		tokenString := tokenParts[1]

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return []byte(secretKey), nil
		})

		if err != nil || !token.Valid {
			slog.Error("Supabase authentication local", slog.Any("error", err))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized",
			})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			slog.Error("Supabase authentication", slog.Any("error", "invalid claims format"))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		sub, exists := claims["sub"]
		if !exists {
			slog.Error("Supabase authentication", slog.Any("error", "missing sub claim"))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		subString, ok := sub.(string)
		if !ok {
			slog.Error("Supabase authentication", slog.Any("error", "invalid sub claim type"))
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		c.Set("user_id", subString)
		c.Next()
	}
}
