package test_local

import (
	"testing"

	"github.com/stretchr/testify/assert" // Public library
)

func TestHello(t *testing.T) {
	t.Log("Hello SkoreFlow!")

	result := 5

	// Just one line is all it takes to control it
	assert.Equal(t, 5, result, "The two values must be equal")
}
