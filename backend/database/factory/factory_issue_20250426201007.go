package factory

import (
	"encoding/json"
	"log/slog"
	"os"
	"webservices/src/model"
	"webservices/src/pkg/log"

	"gorm.io/gorm"
)

type issueFactory struct {
	db *gorm.DB
}

func NewIssueFactory(db *gorm.DB) *issueFactory {
	return &issueFactory{db: db}
}

func (f *issueFactory) Create() error {
	filepath := "./storage/backup/20250522/backup_issues_202505221339.json"

	data, err := os.ReadFile(filepath)
	if err != nil {
		log.Error("Failed to read file", slog.Any("error", err))
		panic(err)
	}

	var issues []model.Issue
	if err := json.Unmarshal(data, &issues); err != nil {
		log.Error("Failed to parse file", slog.Any("error", err))
		panic(err)
	}

	err = f.db.Transaction(func(tx *gorm.DB) error {
		if result := tx.Create(&issues); result.Error != nil {
			return result.Error
		}

		log.Infof("Successfully added issues %s", slog.Int("count", len(issues)))

		return nil
	})

	return err
}

func (f *issueFactory) CreateBatch(count int) error {
	for range count {
		if err := f.Create(); err != nil {
			return err
		}
	}
	return nil
}
