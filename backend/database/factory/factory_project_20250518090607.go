package factory

import (
	"encoding/json"
	"log/slog"
	"os"
	"webservices/src/model"
	"webservices/src/pkg/log"

	"gorm.io/gorm"
)

type projectFactory struct {
	db *gorm.DB
}

func NewProjectFactory(db *gorm.DB) *projectFactory {
	return &projectFactory{db: db}
}

func (f *projectFactory) Create() error {
	filepath := "./storage/backup/20250522/backup_projects_202505221339.json"

	data, err := os.ReadFile(filepath)
	if err != nil {
		log.Error("Failed to read file", slog.Any("error", err))
		panic(err)
	}

	var projects []model.Project
	if err := json.Unmarshal(data, &projects); err != nil {
		log.Error("Failed to parse file", slog.Any("error", err))
		panic(err)
	}

	err = f.db.Transaction(func(tx *gorm.DB) error {
		if result := tx.Save(&projects); result.Error != nil {
			return result.Error
		}

		log.Infof("Successfully added projects %s", slog.Int("count", len(projects)))

		return nil
	})

	return err
}

func (f *projectFactory) CreateBatch(count int) error {
	for range count {
		if err := f.Create(); err != nil {
			return err
		}
	}
	return nil
}
