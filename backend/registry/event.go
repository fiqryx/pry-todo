package registry

import (
	"webservices/src/events"
	"webservices/src/model"

	"github.com/zishang520/socket.io/v2/socket"
)

type Events struct {
	Notif *events.NotificationEvent
}

func NewEvents(user *model.User, socket *socket.Socket, services *Services) *Events {
	return &Events{
		Notif: events.NewNotificationEvent(user, socket, services.Notif),
	}
}
