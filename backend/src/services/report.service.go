package services

import (
	"webservices/src/model"
	"webservices/src/repo"
	"webservices/src/types"
)

type ReportService struct {
	reportRepo *repo.ReportRepository
}

func NewReportService(
	reportRepo *repo.ReportRepository,
) *ReportService {
	return &ReportService{
		reportRepo: reportRepo,
	}
}

func (s *ReportService) GetReports(limit, offset int) ([]model.Report, error) {
	return s.reportRepo.GetLimit(limit, offset)
}

func (s *ReportService) GetByID(ID string) (*model.Report, error) {
	return s.reportRepo.GetByID(ID)
}

func (s *ReportService) GetByUser(userID string) ([]model.Report, error) {
	return s.reportRepo.GetByUser(userID)
}

func (s *ReportService) Create(userID, message string, tipe types.ReportType) (*model.Report, error) {
	report := model.Report{
		UserID:  userID,
		Type:    tipe,
		Message: message,
	}

	if err := s.reportRepo.Create(&report); err != nil {
		return nil, err
	}

	return &report, nil
}

func (s *ReportService) Delete(ID string) error {
	report, err := s.reportRepo.GetByID(ID)
	if err != nil {
		return err
	}
	return s.reportRepo.Delete(report.ID)
}
