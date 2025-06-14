package structers

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
	"webservices/src/pkg/common"
	"webservices/src/pkg/log"

	"gorm.io/gorm"
)

type DatabaseRegistry struct {
	Enums      []Enum
	Models     []any
	Extensions []string
	Tables     []string
	Factories  []func(*gorm.DB) error
}

func (r *DatabaseRegistry) GetEnums() []Enum {
	return r.Enums
}

func (r *DatabaseRegistry) GetTables() []string {
	return r.Tables
}

func (r *DatabaseRegistry) GetModels() []any {
	return r.Models
}

func (r *DatabaseRegistry) GetExtensions() []string {
	return r.Extensions
}

func (r *DatabaseRegistry) GetFactories() []func(*gorm.DB) error {
	return r.Factories
}

func (r *DatabaseRegistry) Migrate(db *gorm.DB, fresh bool) error {
	log.Info("Starting database migration...")

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if fresh {
		if err := dropAll(tx, r); err != nil {
			tx.Rollback()
			return err
		}
	}

	if err := createExtensions(tx, r.Extensions); err != nil {
		tx.Rollback()
		return err
	}

	if err := createEnums(tx, r.Enums); err != nil {
		tx.Rollback()
		return err
	}

	if !fresh {
		for _, enum := range r.Enums {
			if err := tx.Exec(enum.UpdateQuery()).Error; err != nil {
				log.Errorf("Add enum value: %s", err.Error())
			}
		}
	}

	if err := tx.AutoMigrate(r.Models...); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	log.Success("✅ Database migration completed successfully")
	return nil
}

func (r *DatabaseRegistry) Backup(db *gorm.DB, output string) error {
	log.Info("Starting database backup...")

	if err := os.MkdirAll(output, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %v", err)
	}

	timestamp := time.Now().Format("200601021504") // YYYYMMDDHHMM format

	for _, table := range r.Tables {
		var results []map[string]any
		if err := db.Table(table).Find(&results).Error; err != nil {
			return fmt.Errorf("failed to query table %s: %v", table, err)
		}

		for i, row := range results {
			camelCaseRow := make(map[string]any)
			for key, value := range row {
				camelKey := common.ToCamelCase(key)
				camelCaseRow[camelKey] = value
			}
			results[i] = camelCaseRow
		}

		filename := fmt.Sprintf("backup_%s_%s.json", table, timestamp)
		filePath := filepath.Join(output, filename)

		file, err := os.Create(filePath)
		if err != nil {
			return fmt.Errorf("failed to create file %s: %v", filePath, err)
		}
		defer file.Close()

		encoder := json.NewEncoder(file)
		encoder.SetIndent("", "  ")
		if err := encoder.Encode(results); err != nil {
			return fmt.Errorf("failed to encode JSON for table %s: %v", table, err)
		}
	}

	log.Info("✅ Database backup completed successfully")
	return nil
}

// helper

func dropAll(tx *gorm.DB, registry *DatabaseRegistry) error {
	tables, err := tx.Migrator().GetTables()
	if err != nil {
		return err
	}

	if len(tables) > 0 {
		if err := tx.Exec(fmt.Sprintf("TRUNCATE %s CASCADE", strings.Join(tables, ", "))).Error; err != nil {
			return err
		}

		for i, t := range tables {
			tables[i] = fmt.Sprintf(`DROP TABLE IF EXISTS "%s" CASCADE`, t)
		}
		if err := tx.Exec(strings.Join(tables, "; ")).Error; err != nil {
			return err
		}
	}

	enumNames := make([]string, len(registry.Enums))
	for i, e := range registry.Enums {
		enumNames[i] = e.Name
	}
	if err := dropEnums(tx, enumNames); err != nil {
		return err
	}

	return nil
}

func createExtensions(tx *gorm.DB, exts []string) error {
	for _, q := range exts {
		query := fmt.Sprintf(`CREATE EXTENSION IF NOT EXISTS "%s"`, q)
		if err := tx.Exec(query).Error; err != nil {
			return err
		}
	}
	return nil
}

func createEnums(tx *gorm.DB, enums []Enum) error {
	for _, e := range enums {
		if err := tx.Exec(e.CreateQuery()).Error; err != nil {
			return err
		}
	}
	return nil
}

func dropEnums(tx *gorm.DB, names []string) error {
	for _, name := range names {
		if err := tx.Exec("DROP TYPE IF EXISTS " + name).Error; err != nil {
			return err
		}
	}
	return nil
}
