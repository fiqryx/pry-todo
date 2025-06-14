package repo

import (
	"errors"
	"fmt"
	"webservices/src/model"

	"gorm.io/gorm"
)

type ReportRepository struct {
	*baseRepository
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{
		baseRepository: newBaseRepository(db),
	}
}

func (r *ReportRepository) GetLimit(limit, offset int) ([]model.Report, error) {
	if limit < 0 {
		return nil, fmt.Errorf("limit cannot be negative")
	}
	if offset < 0 {
		return nil, fmt.Errorf("offset cannot be negative")
	}

	var reports []model.Report

	if err := r.db.Joins("User").
		Order("created_at DESC").
		Find(&reports).Limit(limit).
		Offset(offset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []model.Report{}, nil
		}
		return nil, fmt.Errorf("failed to fetch reports: %w", err)
	}

	return reports, nil
}

func (r *ReportRepository) GetByID(ID string) (*model.Report, error) {
	var report model.Report
	if err := r.db.First(&report, "id = ?", ID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch report: %w", err)
	}
	return &report, nil
}

func (r *ReportRepository) GetByUser(userID string) ([]model.Report, error) {
	var reports []model.Report
	if err := r.db.Joins("User").Find(&reports,
		"reports.user_id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch report: %w", err)
	}
	return reports, nil
}

func (r *ReportRepository) Create(report *model.Report) error {
	return r.CreateTx(r.db, report)
}

func (r *ReportRepository) CreateTx(tx *gorm.DB, report *model.Report) error {
	if err := tx.Create(report).Error; err != nil {
		return fmt.Errorf("failed to create report: %w", err)
	}
	return nil
}

func (r *ReportRepository) Delete(ID string) error {
	return r.DeleteTx(r.db, ID)
}

func (r *ReportRepository) DeleteTx(tx *gorm.DB, ID string) error {
	if err := tx.Delete(&model.Report{}, "id = ?", ID).Error; err != nil {
		return fmt.Errorf("failed to delete report: %w", err)
	}
	return nil
}
