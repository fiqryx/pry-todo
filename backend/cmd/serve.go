package cmd

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	"webservices/database"
	"webservices/src/middleware"
	"webservices/src/pkg"
	c "webservices/src/pkg/common"
	"webservices/src/pkg/logger"
	"webservices/src/routes"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
	"github.com/zishang520/socket.io/v2/socket"
)

func NewServeCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "serve",
		Short: "Start http server",
		Run: func(cmd *cobra.Command, args []string) {
			host, _ := cmd.Flags().GetString("host")
			port, _ := cmd.Flags().GetString("port")
			dsn, _ := cmd.Flags().GetString("dsn")
			debug, _ := cmd.Flags().GetBool("debug")

			log.SetFlags(log.LstdFlags | log.Lshortfile)
			gin.SetMode(gin.ReleaseMode)
			info := pkg.GetVersion()

			showVersion := flag.Bool("version", info.Show, "Show version information")
			flag.Parse()
			if *showVersion {
				logger.Info("System",
					slog.String("version", info.Version),
					slog.String("go", info.Go),
					slog.String("compiler", info.Compiler),
					slog.String("platform", info.Platform),
				)
			}

			database.Connect(dsn, debug)
			server := NewServer(host, port)

			ctx, cancel := context.WithCancel(context.Background())
			sig := make(chan os.Signal, 1)
			signal.Notify(sig, os.Interrupt, syscall.SIGTERM)

			go func() {
				<-sig
				logger.Info("Shutdown server...")
				cancel()
			}()

			go func() {
				server.Start()
			}()

			<-ctx.Done()

			if err := database.Disconnect(); err != nil {
				logger.Error("Close database connection", slog.Any("error", err))
				panic(err)
			}
			logger.Info("Database disconnected")

			server.Stop(10 * time.Second)
		},
	}

	cmd.Flags().StringP("host", "H", c.Env("HOST", "localhost"), "Server host")
	cmd.Flags().StringP("port", "p", c.Env("PORT", "8000"), "Server port")

	return cmd
}

type Server struct {
	http *http.Server
}

func NewServer(host, port string) *Server {
	db := database.DB()
	router := gin.Default()

	io := socket.NewServer(nil, nil)
	options := socket.DefaultServerOptions()

	// if want linked storage
	// Linux/macOS: ln -s ./storage/users ./public/users
	// Windows : mklink /D .\public\users .\storage\users
	router.Static("/public", "storage/public")
	router.StaticFile("/favicon.ico", "storage/public/logo.ico")
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.Cors())

	routes.Event(io, db)
	router.GET("/socket.io/*any", gin.WrapH(io.ServeHandler(options)))
	router.POST("/socket.io/*any", gin.WrapH(io.ServeHandler(options)))
	routes.Api(io, db, router.Group("/api"))

	router.NoRoute(func(ctx *gin.Context) {
		switch ctx.NegotiateFormat(gin.MIMEJSON, gin.MIMEHTML) {
		case gin.MIMEJSON:
			ctx.JSON(404, gin.H{"error": "Not found"})
		case gin.MIMEHTML:
			ctx.String(404, "Page not found")
		default:
			ctx.String(404, "Not found")
		}
	})

	return &Server{
		http: &http.Server{
			Addr:    fmt.Sprintf("%s:%s", host, port),
			Handler: router,
		},
	}
}

func (server *Server) Start() {
	logger.Info("Listening on", slog.String("url", "http://"+server.http.Addr))
	if err := server.http.ListenAndServe(); err != nil &&
		!errors.Is(err, http.ErrServerClosed) {
		logger.Error("Start Http server", slog.Any("error", err))
		panic("Start Http server")
	}
}

func (server *Server) Stop(timeout time.Duration) {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	if err := server.http.Shutdown(ctx); err != nil {
		logger.Error("Stop Http server", slog.Any("error", err))
		panic("Stop Http server")
	}
	logger.Info("Http server stopped")
}
