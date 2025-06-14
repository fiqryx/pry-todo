package factory

import (
	"encoding/json"
	"log/slog"
	"os"
	"webservices/src/model"
	"webservices/src/pkg/log"

	"gorm.io/gorm"
)

type userFactory struct {
	db *gorm.DB
}

func NewUserFactory(db *gorm.DB) *userFactory {
	return &userFactory{db: db}
}

func (f *userFactory) Create() error {
	filepath := "./storage/backup/20250522/backup_users_202505221339.json"

	data, err := os.ReadFile(filepath)
	if err != nil {
		log.Error("Failed to read file", slog.Any("error", err))
		panic(err)
	}

	var users []model.User
	if err := json.Unmarshal(data, &users); err != nil {
		log.Error("Failed to parse file", slog.Any("error", err))
		panic(err)
	}

	err = f.db.Transaction(func(tx *gorm.DB) error {
		if result := tx.Create(&users); result.Error != nil {
			return result.Error
		}

		log.Infof("Successfully added users %s", slog.Int("count", len(users)))

		return nil
	})

	return err
}

func (f *userFactory) CreateBatch(count int) error {
	for range count {
		if err := f.Create(); err != nil {
			return err
		}
	}
	return nil
}
