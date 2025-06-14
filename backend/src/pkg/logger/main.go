// logger/logger.go
package logger

import (
	"fmt"
	"strings"
	"time"
	"webservices/src/pkg/common"

	"github.com/fatih/color"
)

type LogLevel string

const (
	LogLevelNone  LogLevel = "NONE"
	LogLevelError LogLevel = "ERROR"
	LogLevelWarn  LogLevel = "WARN"
	LogLevelInfo  LogLevel = "INFO"
	LogLevelDebug LogLevel = "DEBUG"
	LogLevelAll   LogLevel = "ALL"
)

var logLevelPriority = map[LogLevel]int{
	LogLevelNone:  0,
	LogLevelError: 1,
	LogLevelWarn:  2,
	LogLevelInfo:  3,
	LogLevelDebug: 4,
	LogLevelAll:   5,
}

var (
	red     = color.New(color.FgRed)     // error
	yellow  = color.New(color.FgYellow)  // warn
	cyan    = color.New(color.FgCyan)    // info
	magenta = color.New(color.FgMagenta) // debug
)

type LoggerOptions struct {
	Prefix    string
	Level     LogLevel
	ShowLevel bool
}

type Logger struct {
	prefix    string
	level     LogLevel
	showLevel bool
}

func NewLogger(options LoggerOptions) *Logger {
	if options.Level == "" {
		options.Level = getDefaultLogLevel()
	}

	return &Logger{
		prefix:    options.Prefix,
		level:     options.Level,
		showLevel: options.ShowLevel,
	}
}

func getDefaultLogLevel() LogLevel {
	level := strings.ToUpper(common.Env("LOG_LEVEL"))
	switch level {
	case "NONE", "ERROR", "WARN", "INFO", "DEBUG", "ALL":
		return LogLevel(level)
	default:
		return LogLevelAll
	}
}

func (l *Logger) canWrite(level LogLevel) bool {
	return logLevelPriority[l.level] >= logLevelPriority[level]
}

func (l *Logger) formatPrefix(level LogLevel) string {
	timestamp := time.Now().Format("2006/01/02 - 15:04:05")
	prefix := l.prefix
	if l.showLevel {
		prefix = fmt.Sprintf("[%s] %s%s", level, timestamp, prefix)
	}
	return prefix
}

func (l *Logger) formatMessage(args ...any) string {
	var builder strings.Builder
	for i, arg := range args {
		if i > 0 {
			builder.WriteString(" ")
		}
		builder.WriteString(fmt.Sprint(arg))
	}
	return builder.String()
}

func (l *Logger) Debug(args ...any) {
	if l.canWrite(LogLevelDebug) {
		magenta.Println(l.formatPrefix(LogLevelDebug), l.formatMessage(args...))
	}
}

func (l *Logger) Debugf(format string, args ...any) {
	if l.canWrite(LogLevelDebug) {
		magenta.Println(l.formatPrefix(LogLevelDebug), fmt.Sprintf(format, args...))
	}
}

func (l *Logger) Info(args ...any) {
	if l.canWrite(LogLevelInfo) {
		cyan.Println(l.formatPrefix(LogLevelInfo), l.formatMessage(args...))
	}
}

func (l *Logger) Infof(format string, args ...any) {
	if l.canWrite(LogLevelInfo) {
		cyan.Println(l.formatPrefix(LogLevelInfo), fmt.Sprintf(format, args...))
	}
}

func (l *Logger) Warn(args ...any) {
	if l.canWrite(LogLevelWarn) {
		yellow.Println(l.formatPrefix(LogLevelWarn), l.formatMessage(args...))
	}
}

func (l *Logger) Warnf(format string, args ...any) {
	if l.canWrite(LogLevelWarn) {
		yellow.Println(l.formatPrefix(LogLevelWarn), fmt.Sprintf(format, args...))
	}
}

func (l *Logger) Error(args ...any) {
	if l.canWrite(LogLevelError) {
		red.Println(l.formatPrefix(LogLevelError), l.formatMessage(args...))
	}
}

func (l *Logger) Errorf(format string, args ...any) {
	if l.canWrite(LogLevelError) {
		red.Println(l.formatPrefix(LogLevelError), fmt.Sprintf(format, args...))
	}
}

var defaultLogger = NewLogger(LoggerOptions{
	Level:     getDefaultLogLevel(),
	ShowLevel: true,
})

func Debug(args ...any) { defaultLogger.Debug(args...) }
func Info(args ...any)  { defaultLogger.Info(args...) }
func Warn(args ...any)  { defaultLogger.Warn(args...) }
func Error(args ...any) { defaultLogger.Error(args...) }

func Debugf(format string, args ...any) { defaultLogger.Debugf(format, args...) }
func Infof(format string, args ...any)  { defaultLogger.Infof(format, args...) }
func Warnf(format string, args ...any)  { defaultLogger.Warnf(format, args...) }
func Errorf(format string, args ...any) { defaultLogger.Errorf(format, args...) }
