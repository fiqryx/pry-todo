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
	return fmt.Sprintf("CREATE TYPE IF NOT EXISTS %s AS ENUM ('%s')", e.Name, strings.Join(e.Values, "', '"))
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
