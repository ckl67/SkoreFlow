package mail

// ======================================================================================
// INFRASTRUCTURE     | utils/         | "Atomic" functions, "blind" to business logic.
//                    |                | (Disk I/O, network calls, file manipulation).
// ======================================================================================

import (
	"backend/infrastructure/config"
	"backend/infrastructure/logger"
	"fmt"
	"net"
	"net/smtp"
	"strconv"
	"strings"
	"time"
)

// SendTextMail sends a plain-text email to the specified recipient.
func SendTextMail(to, subject, body string) error {
	return sendMail(to, subject, body, "text/plain")
}

// SendHTMLMail sends an HTML email to the specified recipient.
func SendHTMLMail(to, subject, body string) error {
	return sendMail(to, subject, body, "text/html")
}

// sendMail sends an email via SMTP with the given content type.
// Handles headers, message ID, authentication, and logging.
func sendMail(to, subject, body, contentType string) error {
	cfg := config.Config().Smtp

	// Skip sending if SMTP is disabled
	if cfg.Enabled != "true" {
		logger.Login.Debug("SMTP disabled - email skipped")
		return nil
	}

	addr := net.JoinHostPort(cfg.HostServerAddr, strconv.Itoa(cfg.HostServerPort))

	auth := smtp.PlainAuth(
		"",
		cfg.Username,
		cfg.Password,
		cfg.HostServerAddr,
	)

	// RFC-standard date header
	date := time.Now().Format(time.RFC1123Z)

	// Simple unique Message-ID
	messageID := fmt.Sprintf("<%d.%s@sheetflow>",
		time.Now().UnixNano(),
		strings.ReplaceAll(cfg.HostServerAddr, "smtp.", ""),
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
		cfg.From,
		to,
		subject,
		date,
		messageID,
		contentType,
		body,
	))

	logger.Login.Debug("Sending email via smtp.SendMail to %s", to)

	err := smtp.SendMail(
		addr,
		auth,
		cfg.From,
		[]string{to},
		msg,
	)
	if err != nil {
		return fmt.Errorf("smtp send error: %w", err)
	}

	logger.Login.Debug("Email sent to %s (Message-ID: %s)", to, messageID)
	return nil
}
