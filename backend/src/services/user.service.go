package services

import (
	"fmt"
	"webservices/src/model"
	"webservices/src/pkg/logger"
	"webservices/src/repo"
)

type UserService struct {
	userRepo *repo.UserRepository
}

func NewUserService(userRepo *repo.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) GetUserByID(ID string) (*model.User, error) {
	return s.userRepo.GetDetail(ID)
}

func (s *UserService) RegisterUserSupabase(ID, name, email string, image *string) (*model.User, error) {
	user := model.User{
		ID:    ID,
		Name:  name,
		Email: email,
		Image: image,
	}

	if err := s.userRepo.Create(&user); err != nil {
		logger.Errorf("failed to register user: %s", err.Error())
		return nil, fmt.Errorf("failed to register user: %w", err)
	}

	return &user, nil
}

func (s *UserService) Update(ID, name string, image *string) (*model.User, error) {
	user, err := s.userRepo.GetByID(ID)
	if err != nil {
		return nil, err
	}

	if user.Name != name {
		user.Name = name
	}

	if image != nil && *image != "" {
		user.Image = image
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return user, nil
}
