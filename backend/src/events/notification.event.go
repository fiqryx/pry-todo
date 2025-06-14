package events

import (
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/services"

	s "github.com/zishang520/socket.io/v2/socket"
)

type NotificationEvent struct {
	user         *model.User
	socket       *s.Socket
	notifService *services.NotificationService
}

func NewNotificationEvent(
	user *model.User,
	socket *s.Socket,
	notifService *services.NotificationService,
) *NotificationEvent {
	return &NotificationEvent{
		user:         user,
		socket:       socket,
		notifService: notifService,
	}
}

func (e *NotificationEvent) GetByUser(a ...any) {
	notifications, err := e.notifService.GetByUser(e.user.ID)
	if err != nil {
		e.socket.Emit("notification:error", err)
		return
	}
	e.socket.Emit("notification:get", notifications)
}

func (e *NotificationEvent) Read(a ...any) {
	if len(a) == 0 || a[0] == nil {
		if err := e.notifService.ReadAll(e.user.ID); err != nil {
			e.socket.Emit("notification:error", err)
		}
		return
	}

	id, ok := a[0].(string)
	if !ok {
		logger.Errorf("failed to parse args")
		return
	}

	if err := e.notifService.Read(id); err != nil {
		e.socket.Emit("notification:error", err)
	}
}
