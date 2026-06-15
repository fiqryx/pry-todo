package structers

import (
	"fmt"
	"strings"
)

type Enum struct {
	Name   string
	Values []string
}

func (e *Enum) CreateQuery() string {
	return fmt.Sprintf(`DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '%s') THEN
        CREATE TYPE %s AS ENUM ('%s');
    END IF;
END $$;`, e.Name, e.Name, strings.Join(e.Values, "', '"))
}

func (e *Enum) UpdateQuery() string {
	var queries []string
	for _, v := range e.Values {
		queries = append(queries, fmt.Sprintf("ALTER TYPE %s ADD VALUE IF NOT EXISTS '%s';", e.Name, v))
	}
	return strings.Join(queries, "\n")
}

func (e *Enum) DropQuery() string {
	return fmt.Sprintf("DROP TYPE IF EXISTS %s", e.Name)
}
