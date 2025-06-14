package routes

import (
	"time"
	"webservices/registry"
	"webservices/src/middleware"
	"webservices/src/model"
	"webservices/src/pkg/logger"

	s "github.com/zishang520/socket.io/v2/socket"
	"gorm.io/gorm"
)

func Event(io *s.Server, db *gorm.DB) {
	repos := registry.NewRepositories(db)
	services := registry.NewServices(repos, io)

	io.Use(middleware.WebSocketAuth(repos.User))
	io.On("connection", func(a ...any) {
		socket := a[0].(*s.Socket)

		var user model.User
		err := user.GetContextSocket(socket)
		if err != nil || user.ID == "" {
			logger.Errorf("failed to fetch user socket_id=%s err=%s", socket.Id(), err)
			time.AfterFunc(500*time.Millisecond, func() {
				socket.Disconnect(true)
			})
			return
		}

		room := s.Room(user.ID)
		events := registry.NewEvents(&user, socket, services)

		socket.Join(room)
		logger.Infof("Socket connect socket_id=%s room_id=%s", socket.Id(), room)

		socket.On("notification:get", events.Notif.GetByUser)
		socket.On("notification:read", events.Notif.Read)

		socket.On("disconnect", func(a ...any) {
			logger.Info("disconnected", socket.Id())
		})
	})
}
