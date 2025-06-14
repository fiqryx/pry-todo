package main

import (
	"log"
	"os"
	"webservices/cmd"
	c "webservices/src/pkg/common"
	"webservices/src/pkg/logger"

	"github.com/spf13/cobra"
)

var description = `Pry Command Line Interface

A unified tool for managing all application components including:
• HTTP Server - Start/Restart the web service
• Database Migrations - Schema version control
• Data Seeding - Populate database with initial data
• Test Factories - Generate fake data for development`

func main() {
	if err := NewCmd().Execute(); err != nil {
		logger.Error(err)
		os.Exit(1)
	}
}

func NewCmd() *cobra.Command {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	var root = &cobra.Command{
		Use:   "prycli",
		Short: "Command Line Interface tool HTTP server, database migrations, seeding, and factories",
		Long:  description,
		Run: func(cmd *cobra.Command, args []string) {
			cmd.Help()
		},
	}

	root.PersistentFlags().StringP("dsn", "d", c.Env("DATABASE_URL"), "Database connection string")
	root.PersistentFlags().BoolP("debug", "D", c.Env("DATABASE_DEBUG") == "true", "Show SQL queries")

	root.AddCommand(cmd.NewServeCmd())
	root.AddCommand(cmd.NewMigrateCmd())
	root.AddCommand(cmd.NewBackupCmd())
	root.AddCommand(cmd.NewMFactoryCmd())
	root.AddCommand(cmd.NewSeedCmd())
	root.AddCommand(cmd.NewMakeModel())
	root.AddCommand(cmd.NewMakeRepo())
	root.AddCommand(cmd.NewMakeServices())
	root.AddCommand(cmd.NewMakeController())

	return root
}
