package cmd

import (
	"fmt"
	"time"
	"webservices/registry"
	"webservices/src/pkg/log"

	"github.com/spf13/cobra"
)

func NewBackupCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "db:backup",
		Short: "Run database backup",
		Run: func(cmd *cobra.Command, args []string) {
			log.Info("Starting database backup...")
			db, err := initDB(cmd)
			if err != nil {
				log.Error("Error initializing database: ", err)
				return
			}

			output, err := cmd.Flags().GetString("output")
			if err != nil {
				log.Errorf("Error getting output directory: %v", err)
				return
			}

			if err := registry.Database.Backup(db, output); err != nil {
				log.Errorf("Backup failed: %v", err)
			}
		},
	}

	output := fmt.Sprintf("./storage/backup/%s", time.Now().Format("20060102"))
	cmd.Flags().StringP("output", "o", output, "Output directory for backup files")

	return cmd
}
