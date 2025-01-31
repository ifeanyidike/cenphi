package utils

import (
	"fmt"
	"time"

	"golang.org/x/exp/rand"
)

func GenerateRandomEmail() string {
	rand.Seed(uint64(time.Now().UnixNano()))
	domains := []string{"example.com", "test.com", "dummy.org", "fakemail.net", "mail.com", "cenphi.com", "cenphi.io", "cenphi.ai"}
	randomDomain := domains[rand.Intn(len(domains))]
	randomUser := RandomString(8)
	return fmt.Sprintf("%s@%s", randomUser, randomDomain)
}

func GenerateRandomUrl() string {
	rand.Seed(uint64(time.Now().UnixNano()))
	randomDomain := RandomString(16)
	return fmt.Sprintf("https://%s.cenphi.io", randomDomain)
}

func RandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	var seededRand = rand.New(rand.NewSource(uint64(time.Now().UnixNano())))
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(result)
}
