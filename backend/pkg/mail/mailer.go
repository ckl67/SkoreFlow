// cspell:ignore STARTTLS
package mail

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net/smtp"
	"strings"
	"time"

	"backend/infrastructure/config"
	"backend/infrastructure/logger"
)

// Build email payload (RFC 822)
func buildMailMessage(from, to, subject, body, contentType string) []byte {
	// RFC-standard date header
	date := time.Now().Format(time.RFC1123Z)

	// Simple unique Message-ID
	messageID := fmt.Sprintf("<%d.%s@skoreflow>",
		time.Now().UnixNano(),
		strings.ReplaceAll(config.Config().Smtp.HostServerAddr, "smtp.", ""),
	)

	msg := []byte(fmt.Sprintf(
		"From: %s\r\n"+
			"To: %s\r\n"+
			"Subject: %s\r\n"+
			"Date: %s\r\n"+
			"Message-ID: %s\r\n"+
			"MIME-Version: 1.0\r\n"+
			"Content-Type: %s; charset=\"UTF-8\"\r\n"+
			"\r\n"+
			"%s\r\n",
		from,
		to,
		subject,
		date,
		messageID,
		contentType,
		body,
	))

	return msg
}

// SendTextMail sends a plain-text email to the specified recipient.
func SendTextMail(to, subject, body string) error {
	return sendMail(to, subject, body, "text/plain")
}

// SendHTMLMail sends an HTML email to the specified recipient.
func SendHTMLMail(to, subject, body string) error {
	return sendMail(to, subject, body, "text/html")
}

// sendMail routes email delivery based on the configured port (465 for TLS, 587/other for STARTTLS).
func sendMail(to, subject, body, contentType string) error {
	cfg := config.Config().Smtp

	// Skip sending if SMTP is disabled
	if !cfg.Enabled {
		logger.Login.Debug("SMTP disabled - email skipped")
		return nil
	}

	// Decode Base64 password
	decodedPassword, err := base64.StdEncoding.DecodeString(cfg.PasswordBase64)
	if err != nil {
		logger.Login.Error("invalid SMTP PasswordBase64 encoding: %v", err)
		return fmt.Errorf("invalid smtp password encoding: %w", err)
	}
	password := string(decodedPassword)
	//logger.Login.Info("password %s", password)

	// Prepare payload message
	msg := buildMailMessage(cfg.From, to, subject, body, contentType)

	// Prepare AUTH
	if cfg.Username == "" {
		return fmt.Errorf("SMTP username is required")
	}

	if password == "" {
		return fmt.Errorf("SMTP password is required")
	}

	var auth smtp.Auth
	if cfg.Username != "" {
		auth = smtp.PlainAuth("", cfg.Username, password, cfg.HostServerAddr)
	}

	targetAddr := fmt.Sprintf("%s:%d", cfg.HostServerAddr, cfg.HostServerPort)
	recipients := []string{to}

	logger.Login.Debug("SMTP Config: Enabled=true, Host=%s, Port=%d, From=%s", cfg.HostServerAddr, cfg.HostServerPort, cfg.From)

	// Connect based on the configured port (465 vs 587)
	if cfg.HostServerPort == 465 {
		logger.Login.Debug("Connecting via Port 465 (Direct SSL)...")

		tlsConfig := &tls.Config{
			ServerName: cfg.HostServerAddr,
			MinVersion: tls.VersionTLS12,
		}

		conn, dialErr := tls.Dial("tcp", targetAddr, tlsConfig)
		if dialErr != nil {
			return fmt.Errorf("TLS dial error: %w", dialErr)
		}
		defer conn.Close()

		client, clientErr := smtp.NewClient(conn, cfg.HostServerAddr)
		if clientErr != nil {
			return fmt.Errorf("SMTP client creation error: %w", clientErr)
		}
		defer client.Quit()

		if auth != nil {
			if authErr := client.Auth(auth); authErr != nil {
				return fmt.Errorf("authentication error: %w", authErr)
			}
		}

		if mailErr := client.Mail(cfg.From); mailErr != nil {
			return fmt.Errorf("MAIL FROM error: %w", mailErr)
		}

		for _, k := range recipients {
			if rcptErr := client.Rcpt(k); rcptErr != nil {
				return fmt.Errorf("RCPT TO error: %w", rcptErr)
			}
		}

		w, dataErr := client.Data()
		if dataErr != nil {
			return fmt.Errorf("DATA command error: %w", dataErr)
		}

		if _, writeErr := w.Write(msg); writeErr != nil {
			return fmt.Errorf("message write error: %w", writeErr)
		}

		// CORRECTION: w.Close() must be called to confirm sending
		if closeErr := w.Close(); closeErr != nil {
			return fmt.Errorf("message close error: %w", closeErr)
		}

		client.Quit()

	} else {
		logger.Login.Debug("Connecting via Port %d (STARTTLS/Plain)...", cfg.HostServerPort)

		client, dialErr := smtp.Dial(targetAddr)
		if dialErr != nil {
			return fmt.Errorf("smtp dial error: %w", dialErr)
		}
		defer client.Close()

		tlsConfig := &tls.Config{
			ServerName: cfg.HostServerAddr,
		}
		if startTlsErr := client.StartTLS(tlsConfig); startTlsErr != nil {
			return fmt.Errorf("smtp starttls error: %w", startTlsErr)
		}

		if auth != nil {
			if authErr := client.Auth(auth); authErr != nil {
				return fmt.Errorf("smtp auth error: %w", authErr)
			}
		}

		if mailErr := client.Mail(cfg.From); mailErr != nil {
			return fmt.Errorf("smtp mail error: %w", mailErr)
		}

		for _, r := range recipients {
			if rcptErr := client.Rcpt(r); rcptErr != nil {
				return fmt.Errorf("smtp rcpt error: %w", rcptErr)
			}
		}

		w, dataErr := client.Data()
		if dataErr != nil {
			return fmt.Errorf("smtp data error: %w", dataErr)
		}

		if _, writeErr := w.Write(msg); writeErr != nil {
			return fmt.Errorf("smtp write error: %w", writeErr)
		}

		if closeErr := w.Close(); closeErr != nil {
			return fmt.Errorf("smtp close error: %w", closeErr)
		}

		client.Quit()
	}

	logger.Login.Debug("Email accepted by SMTP server for %s", to)
	return nil
}
