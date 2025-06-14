package cipher

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
)

func Encrypt(key []byte, data any) (*string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	bytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	blockSize := block.BlockSize()
	paddedData := pkcs7Padding(bytes, blockSize)

	ciphertext := make([]byte, blockSize+len(paddedData))
	iv := ciphertext[:blockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}

	mode := cipher.NewCBCEncrypter(block, iv)
	mode.CryptBlocks(ciphertext[blockSize:], paddedData)

	result := base64.URLEncoding.EncodeToString(ciphertext)
	return &result, nil
}

func Decrypt[T any](key []byte, encrypted string) (*T, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	ciphertext, err := base64.URLEncoding.DecodeString(encrypted)
	if err != nil {
		return nil, err
	}

	if len(ciphertext)%aes.BlockSize != 0 {
		return nil, fmt.Errorf("ciphertext length is not a multiple of the block size")
	}

	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(ciphertext, ciphertext)

	unpaddedData := pkcs7Unpadding(ciphertext)

	var decrypted *T
	if err := json.Unmarshal(unpaddedData, &decrypted); err != nil {
		return nil, err
	}

	return decrypted, nil
}

func pkcs7Padding(data []byte, blockSize int) []byte {
	padding := blockSize - len(data)%blockSize
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padText...)
}

func pkcs7Unpadding(data []byte) []byte {
	padding := int(data[len(data)-1])
	return data[:len(data)-padding]
}
