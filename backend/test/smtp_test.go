package test_local

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"testing"

	"github.com/golobby/config/v3"
	"github.com/golobby/config/v3/pkg/feeder"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// SMTPConfig maps environment variables from .env
type SMTPConfig struct {
	Host     string `env:"SMTP_HOST"`
	Port     int    `env:"SMTP_PORT"`
	From     string `env:"SMTP_FROM"`
	Username string `env:"SMTP_USERNAME"`
	Password string `env:"SMTP_PASSWORD"`
}

func TestSMTPServerLWS_GoLobby(t *testing.T) {
	var cfg SMTPConfig

	// 1. Initialize GoLobby Config feeder to parse the .env file
	// Tries parent directory first, then fallback to current directory
	c := config.New()
	c.AddFeeder(feeder.DotEnv{Path: "../.env"})

	c.AddStruct(&cfg) // <-- Pass the pointer to the structure here
	err := c.Feed()   // <-- Feed() is called without any arguments
	require.NoError(t, err, "Failed to load configuration via GoLobby")

	// Fallback to sender email if username is empty
	if cfg.Username == "" {
		cfg.Username = cfg.From
	}

	// 2. Validate essential fields loaded by GoLobby
	require.NotEmpty(t, cfg.Host, "SMTP_HOST loaded by GoLobby must not be empty")
	require.NotEmpty(t, cfg.Password, "SMTP_PASSWORD loaded by GoLobby must not be empty")

	recipientEmail := "christian.klugesherz@gmail.com"
	t.Logf("Starting LWS SMTP test via GoLobby config on %s:%d...", cfg.Host, cfg.Port)

	// 3. Build email payload (RFC 822)
	subject := "Subject: [SkoreFlow Test] GoLobby SMTP Validation\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := "<html><body><h3>SkoreFlow Test Passed!</h3><p>SMTP connection successfully established using GoLobby configuration.</p></body></html>"

	msg := []byte(
		"From: SkoreFlow Test <" + cfg.From + ">\r\n" +
			"To: " + recipientEmail + "\r\n" +
			subject + mime + body + "\r\n",
	)

	// 4. Prepare PLAIN authentication using GoLobby values
	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

	targetAddr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	// 5. Connect based on the configured port
	if cfg.Port == 465 {
		t.Log("Connecting via Port 465 (Direct SSL)...")
		err = sendMailTLS(targetAddr, auth, cfg.From, []string{recipientEmail}, msg, cfg.Host)
	} else {
		t.Logf("Connecting via Port %d (STARTTLS/Plain)...", cfg.Port)
		err = smtp.SendMail(targetAddr, auth, cfg.From, []string{recipientEmail}, msg)
	}

	// 6. Testify assertions
	assert.NoError(t, err, "Email delivery using GoLobby configuration must complete without errors")
}

// Helper function to handle implicit TLS/SSL connection (Port 465)
func sendMailTLS(addr string, auth smtp.Auth, from string, to []string, msg []byte, serverName string) error {
	tlsConfig := &tls.Config{
		ServerName: serverName,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("TLS dial error: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, serverName)
	if err != nil {
		return fmt.Errorf("SMTP client creation error: %w", err)
	}
	defer client.Quit()

	if auth != nil {
		if err = client.Auth(auth); err != nil {
			return fmt.Errorf("authentication error: %w", err)
		}
	}

	if err = client.Mail(from); err != nil {
		return fmt.Errorf("MAIL FROM error: %w", err)
	}

	for _, k := range to {
		if err = client.Rcpt(k); err != nil {
			return fmt.Errorf("RCPT TO error: %w", err)
		}
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("DATA command error: %w", err)
	}

	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("message write error: %w", err)
	}

	return w.Close()
}
