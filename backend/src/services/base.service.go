package services

import "github.com/zishang520/socket.io/v2/socket"

type baseService struct {
	io *socket.Server
}

func newBaseService(io *socket.Server) *baseService {
	return &baseService{io: io}
}

func (s *baseService) emit(room, event string, args any) {
	s.io.To(socket.Room(room)).Emit(event, args)
}

func (s *baseService) broadcast(event string, args ...any) {
	s.io.Sockets().Emit(event, args)
}
