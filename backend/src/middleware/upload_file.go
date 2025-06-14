package middleware

import (
	"errors"
	"mime/multipart"
	"webservices/src/pkg/common"
	"webservices/src/types"

	"github.com/gin-gonic/gin"
)

type UploadFile struct {
	key        string
	maxFiles   int
	maxSize    int64
	mimes      []types.Mime
	isRequired bool
}

type FileHeader struct {
	Files []*multipart.FileHeader `form:"-" binding:"omitempty"`
}

// NewUploadFile creates a new file upload configuration with validation rules.
//
// Parameters:
//   - key:        Form key name in request (default: "files")
//   - maxFiles:   Maximum number of allowed files (0 = unlimited)
//   - maxSize:    Maximum file size in megabytes (MB)
//   - isRequired: When true, rejects requests with no files
//   - mimes:      Pointer to slice of allowed MIME types (nil = allow all)
//
// Returns:
//
//	*UploadFile: Configured file upload validator instance
//
// Example:
//
//		// Allow 2 PDF/JPEG files (<5MB each), required
//		allowed := []types.Mime{types.MimePDF, types.MimeJPEG}
//		uploadCfg := NewUploadFile("documents", 2, 5, true, &allowed)
//
//	  // Allow any single file (<10MB), optional
//		uploadCfg := NewUploadFile("attachment", 1, 10, false, nil)
func NewUploadFile(
	key string,
	maxFiles int,
	maxSize int64,
	isRequired bool,
	mimes *[]types.Mime,
) *UploadFile {
	if mimes == nil {
		mimes = &[]types.Mime{}
	}

	return &UploadFile{
		key:        key,
		maxFiles:   maxFiles,
		maxSize:    maxSize,
		isRequired: isRequired,
		mimes:      *mimes,
	}
}

func (f *UploadFile) Handler(c *gin.Context) {
	var bind FileHeader
	err := c.ShouldBind(&bind)

	if c.Request.MultipartForm == nil && f.isRequired {
		c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
		return
	}

	var files []*multipart.FileHeader
	if c.Request.MultipartForm != nil {
		if len(c.Request.MultipartForm.File) > f.maxFiles {
			c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
			return
		}

		for key := range c.Request.MultipartForm.File {
			if err != nil {
				break
			}
			filesHeader := c.Request.MultipartForm.File[key]
			for _, item := range filesHeader {
				if item.Size > f.maxSize<<20 {
					err = errors.New("invalid files size")
				}
				mime := item.Header.Get("Content-Type")
				if len(f.mimes) > 0 && !common.Include(f.mimes, types.Mime(mime)) {
					err = errors.New("invalid files type")
					break
				}
				files = append(files, item)
			}
		}
	}

	if err != nil {
		c.AbortWithStatusJSON(400, gin.H{"error": "bad request"})
		return
	}

	if f.key == "" {
		f.key = "files"
	}

	c.Set(f.key, files)
	c.Next()
}
