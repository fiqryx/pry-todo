package cmd

import (
	"fmt"
	"webservices/registry"
	"webservices/src/pkg/log"

	"github.com/spf13/cobra"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewMigrateCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "migrate",
		Short: "Run database migration",
		Run: func(cmd *cobra.Command, args []string) {
			db, err := initDB(cmd)
			if err != nil {
				log.Error("Error initializing database: ", err)
				return
			}

			fresh, _ := cmd.Flags().GetBool("fresh")
			if err := registry.Database.Migrate(db, fresh); err != nil {
				log.Errorf("Migration failed: %v", err)
			}
		},
	}

	cmd.Flags().BoolP("fresh", "f", false, "force fresh migration")

	return cmd
}

func initDB(cmd *cobra.Command) (*gorm.DB, error) {
	dsn, err := cmd.Flags().GetString("dsn")
	if err != nil {
		return nil, err
	}

	debug, err := cmd.Flags().GetBool("debug")
	if err != nil {
		return nil, err
	}

	config := &gorm.Config{}

	if debug {
		config.Logger = logger.Default.LogMode(logger.Info)
		fmt.Println("[DEBUG] Database debug mode enabled - SQL queries will be logged")
	} else {
		config.Logger = logger.Default.LogMode(logger.Silent)
	}

	log.Info("Connecting to database...")
	db, err := gorm.Open(postgres.Open(dsn), config)
	if err != nil {
		return nil, fmt.Errorf("failed to connect database: %v", err)
	}

	log.Success("Database connection established")
	return db, nil
}
