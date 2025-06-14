package database

import (
	"log"
	"log/slog"
	"sync"
	"time"
	c "webservices/src/pkg/common"

	l "webservices/src/pkg/logger"

	s "github.com/supabase-community/supabase-go"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

var (
	db       *gorm.DB
	once     sync.Once
	supabase *s.Client
)

func Connect(dsn string, debug bool) {
	once.Do(func() {
		var loggerConfig logger.Interface
		if debug {
			loggerConfig = logger.Default.LogMode(logger.Info)
			l.Debug("Database debug mode enabled - SQL queries will be logged")
		} else {
			loggerConfig = logger.Default.LogMode(logger.Silent)
		}

		var err error
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			TranslateError: true,
			Logger:         loggerConfig,
			NamingStrategy: schema.NamingStrategy{
				// SingularTable: true,
			},
		})

		if err != nil {
			l.Error("Database connection", slog.Any("error", err))
			panic(err)
		}

		sqlDB, err := db.DB()
		if err != nil {
			log.Fatalf("Database SQL DB instance error: %v", err)
		}

		sqlDB.SetMaxOpenConns(10)
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetConnMaxLifetime(time.Hour)

		supabase, err = s.NewClient(
			c.Env("SUPABASE_URL"),
			c.Env("SUPABASE_ANON_KEY"),
			&s.ClientOptions{},
		)

		if err != nil {
			log.Fatalf("Initalize supbase client error: %v", err)
		}

		l.Info("Database connected")
	})
}

func DB() *gorm.DB {
	return db
}

func Supabase() *s.Client {
	return supabase
}

func Disconnect() error {
	instance, err := db.DB()
	if err != nil {
		return err
	}

	if err = instance.Close(); err != nil {
		return err
	}

	db = nil
	return nil
}
