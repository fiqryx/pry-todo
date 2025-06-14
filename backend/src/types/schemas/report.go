package schemas

import "webservices/src/types"

type CreateReport struct {
	Type    types.ReportType `json:"type" binding:"required,oneof=feedback bug feature other"`
	Message string           `json:"message" binding:"required,min=10"`
}
