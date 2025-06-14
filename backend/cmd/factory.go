package cmd

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	c "webservices/src/pkg/common"
	"webservices/src/pkg/file"

	"github.com/spf13/cobra"
)

func NewMFactoryCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "make:factory",
		Short: "Create database factory",
		Run: func(cmd *cobra.Command, args []string) {
			name, err := cmd.Flags().GetString("name")
			if err != nil || name == "" {
				slog.Error("Required flag --name not provided")
				return
			}

			outputDir, err := cmd.Flags().GetString("output")
			if err != nil {
				slog.Error("Getting output directory: %v", slog.Any("error", err))
				return
			}

			if err := os.MkdirAll(outputDir, 0755); err != nil {
				slog.Error("Creating output directory", slog.Any("error", err))
				return
			}

			timestamp := time.Now().Format("20060102150405")
			filename := fmt.Sprintf("%s_%s_factory.go", timestamp, name)

			data := map[string]any{
				"Name": c.ToUpper(c.ToCamelCase(name)),
			}

			file.Create(filepath.Join(outputDir, filename), factoryCode, &data)
		},
	}

	cmd.Flags().StringP("name", "n", "", "Factory name (required)")
	cmd.Flags().StringP("output", "o", "./database/factory", "Output directory for factory files")

	return cmd
}

const factoryCode = `package factory
import (
	"gorm.io/gorm"
)

type {{.Name}}Factory struct {
	db *gorm.DB
}

func New{{.Name}}Factory(db *gorm.DB) *{{.Name}}Factory {
	return &{{.Name}}Factory{db: db}
}

func (f *{{.Name}}Factory) Create() error {
	// Implement your factory logic here
	// Example:
	// data := &models.{{.Name}}{
	//     Field1: faker.Word(),
	//     Field2: faker.Email(),
	// }
	// return f.db.Create(data).Error
	return nil
}

func (f *{{.Name}}Factory) CreateBatch(count int) error {
	for range count {
		if err := f.Create(); err != nil {
			return err
		}
	}
	return nil
}
`
