package types

import (
	"fmt"
	"time"
)

type Date struct {
	time.Time
}

func (d *Date) UnmarshalJSON(b []byte) error {
	s := string(b)
	s = s[1 : len(s)-1] // Trim quotes

	layouts := []string{
		"2006-01-02T15:04:05.000Z", // Full datetime with milliseconds
		"2006-01-02T15:04:05Z",     // Full datetime without milliseconds
		"2006-01-02",               // Date-only format
	}

	var err error
	var parseTime time.Time
	for _, v := range layouts {
		parseTime, err = time.Parse(v, s)
		if err == nil {
			d.Time = parseTime
			return nil
		}
	}

	return err
}

func (d *Date) Bind(value string) error {
	layouts := []string{
		"2006-01-02T15:04:05.000Z",
		"2006-01-02T15:04:05Z",
		"2006-01-02",
	}

	var err error
	for _, layout := range layouts {
		if d.Time, err = time.Parse(layout, value); err == nil {
			return nil
		}
	}

	return fmt.Errorf("invalid date format")
}
