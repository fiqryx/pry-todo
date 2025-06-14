package repo

import "gorm.io/gorm"

type baseRepository struct {
	db *gorm.DB
}

func newBaseRepository(db *gorm.DB) *baseRepository {
	return &baseRepository{db: db}
}

func (r *baseRepository) DB() *gorm.DB {
	return r.db
}

func (r *baseRepository) Begin() *gorm.DB {
	return r.db.Begin()
}

func (r *baseRepository) Commit() *gorm.DB {
	return r.db.Commit()
}

func (r *baseRepository) Rollback() *gorm.DB {
	return r.db.Rollback()
}
