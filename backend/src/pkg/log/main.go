package log

import (
	"fmt"
	"io"
	"os"

	"github.com/fatih/color"
)

type Log struct {
	out io.Writer // allows output redirection for testing
}

var (
	std = Log{out: os.Stdout} // standard logger instance

	// Color definitions with bold for better visibility
	red    = color.New(color.FgRed, color.Bold)
	yellow = color.New(color.FgYellow, color.Bold)
	cyan   = color.New(color.FgCyan)
	green  = color.New(color.FgGreen, color.Bold)
)

// Error prints error messages in red
func (l Log) Error(args ...interface{}) {
	fmt.Fprintln(l.out, red.Sprint(args...))
}

// Errorf prints formatted error messages in red
func (l Log) Errorf(format string, args ...interface{}) {
	fmt.Fprintln(l.out, red.Sprintf(format, args...))
}

// Warn prints warning messages in yellow
func (l Log) Warn(args ...interface{}) {
	fmt.Fprintln(l.out, yellow.Sprint(args...))
}

// Warnf prints formatted warning messages in yellow
func (l Log) Warnf(format string, args ...interface{}) {
	fmt.Fprintln(l.out, yellow.Sprintf(format, args...))
}

// Info prints info messages in cyan
func (l Log) Info(args ...interface{}) {
	fmt.Fprintln(l.out, cyan.Sprint(args...))
}

// Infof prints formatted info messages in cyan
func (l Log) Infof(format string, args ...interface{}) {
	fmt.Fprintln(l.out, cyan.Sprintf(format, args...))
}

// Success prints success messages in green
func (l Log) Success(args ...interface{}) {
	fmt.Fprintln(l.out, green.Sprint(args...))
}

// Successf prints formatted success messages in green
func (l Log) Successf(format string, args ...interface{}) {
	fmt.Fprintln(l.out, green.Sprintf(format, args...))
}

// Package level functions for convenience

func Error(args ...interface{}) {
	std.Error(args...)
}

func Errorf(format string, args ...interface{}) {
	std.Errorf(format, args...)
}

func Warn(args ...interface{}) {
	std.Warn(args...)
}

func Warnf(format string, args ...interface{}) {
	std.Warnf(format, args...)
}

func Info(args ...interface{}) {
	std.Info(args...)
}

func Infof(format string, args ...interface{}) {
	std.Infof(format, args...)
}

func Success(args ...interface{}) {
	std.Success(args...)
}

func Successf(format string, args ...interface{}) {
	std.Successf(format, args...)
}

// New creates a new logger instance with custom output writer
func New(out io.Writer) Log {
	return Log{out: out}
}
