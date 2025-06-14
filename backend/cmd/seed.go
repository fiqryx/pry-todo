package cmd

import (
	"webservices/registry"
	"webservices/src/pkg/log"

	"github.com/spf13/cobra"
)

func NewSeedCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "db:seed",
		Short: "Database seeding",
		Run: func(cmd *cobra.Command, args []string) {
			log.Info("Starting database seeding...")
			db, err := initDB(cmd)
			if err != nil {
				log.Error("Error initializing database: ", err)
				return
			}

			for _, f := range registry.Database.GetFactories() {
				if err := f(db); err != nil {
					log.Errorf("Error factory: %v", err)
					continue
				}
			}

			log.Success("Database seeding completed!")
		},
	}

	cmd.Flags().IntP("count", "c", 1, "Number of records to seed")
	return cmd
}
