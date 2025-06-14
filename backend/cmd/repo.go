package cmd

import (
	"fmt"
	"log/slog"
	"path/filepath"
	c "webservices/src/pkg/common"
	"webservices/src/pkg/file"

	"github.com/spf13/cobra"
)

func NewMakeRepo() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "make:repo",
		Short: "Create new repositories",
		Run: func(cmd *cobra.Command, args []string) {
			name, err := cmd.Flags().GetString("name")
			if err != nil || name == "" {
				slog.Error("Required flag --name not provided")
				return
			}

			filename := fmt.Sprintf("%s.repository.go", name)
			outputDir, err := cmd.Flags().GetString("output")
			if err != nil {
				slog.Error("Getting output directory: %v", slog.Any("error", err))
				return
			}

			data := map[string]any{
				"Name": c.ToUpper(c.ToCamelCase(name)),
			}

			file.Create(filepath.Join(outputDir, filename), repoCode, &data)
		},
	}

	cmd.Flags().StringP("name", "n", "", "Repositories name (required)")
	cmd.Flags().StringP("output", "o", "./src/repo", "Output directory for repositories")

	return cmd
}

const repoCode = `package repo
import (
	"gorm.io/gorm"
)

type {{.Name}}Repository struct {
	*baseRepository
}

// inject depedencies on the params, and adjust on [registry/repository.go]
func New{{.Name}}Repository(db *gorm.DB) *{{.Name}}Repository {
	return &{{.Name}}Repository{
		baseRepository: newBaseRepository(db),
	}
}
`
