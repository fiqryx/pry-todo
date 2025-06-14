package factory

import (
	"encoding/json"
	"log/slog"
	"os"
	"webservices/src/model"
	"webservices/src/pkg/log"

	"gorm.io/gorm"
)

type UserProjectFactory struct {
	db *gorm.DB
}

func NewUserProjectFactory(db *gorm.DB) *UserProjectFactory {
	return &UserProjectFactory{db: db}
}

func (f *UserProjectFactory) Create() error {
	filepath := "./storage/backup/20250522/backup_user_projects_202505221339.json"

	data, err := os.ReadFile(filepath)
	if err != nil {
		log.Error("Failed to read file", slog.Any("error", err))
		panic(err)
	}

	var users []model.UserProject
	if err := json.Unmarshal(data, &users); err != nil {
		log.Error("Failed to parse file", slog.Any("error", err))
		panic(err)
	}

	err = f.db.Transaction(func(tx *gorm.DB) error {
		if result := tx.Create(&users); result.Error != nil {
			return result.Error
		}

		log.Infof("Successfully added user projects %s", slog.Int("count", len(users)))

		return nil
	})

	return err
}

func (f *UserProjectFactory) CreateBatch(count int) error {
	for range count {
		if err := f.Create(); err != nil {
			return err
		}
	}
	return nil
}
