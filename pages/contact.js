import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";
import emailjs from "@emailjs/browser";
import styles from "../styles/contact.module.css";

const ContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  // useEffect(() => {
  //   if (submit) {
  //     setTimeout(() => {
  //       setSubmit(false);
  //     }, 3000);
  //   }
  // }, [submit]);

  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    }

    if (!email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
      isValid = false;
    }

    if (!message.trim()) {
      errors.message = "Message is required";
      isValid = false;
    }

    setErrors(errors);
    return isValid;
  };

  const submitBtn = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);

      try {
        const templateParams = {
          from_name: name,
          from_email: email,
          message: message + ` From: ${email} `,
          to_name: "Gowtham Gaddam", // Replace with your name
        };

        await emailjs.send(
          "service_portfolio_gaddam", // Replace with your EmailJS service ID
          "template_egzlpcf", // Replace with your EmailJS template ID
          templateParams,
          "bC62hbKjJBY4fZshL" // Replace with your EmailJS public key
        );

        setSubmit(true);
        setEmail("");
        setMessage("");
        setName("");
        setTimeout(() => {
          setSubmit(false);
        }, 5000);
      } catch (error) {
        console.error("Failed to send email:", error);
        alert("Failed to send message. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box className={styles.contactForm} id="contact">
      <Typography
        variant="h1"
        align="left"
        gutterBottom
        className={styles.formTitle}
      >
        Contact
      </Typography>
      <Typography
        variant="body1"
        align="left"
        gutterBottom
        className={styles.formSubtitle}
      >
        I would love to hear from you
      </Typography>
      <Box component="form" noValidate>
        <Box className={styles.formNameAndEmail}>
          <TextField
            required
            fullWidth
            margin="normal"
            variant="filled"
            placeholder="Name"
            className={`${styles.formInput} ${
              errors.name ? styles.inputError : ""
            }`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            required
            fullWidth
            margin="normal"
            variant="filled"
            placeholder="Email address"
            type="email"
            className={`${styles.formInput} ${
              errors.email ? styles.inputError : ""
            }`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
          />
        </Box>
        <TextField
          required
          fullWidth
          multiline
          rows={4}
          margin="normal"
          variant="filled"
          placeholder="Message"
          className={`${styles.formInput} ${
            errors.message ? styles.inputError : ""
          }`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={!!errors.message}
          helperText={errors.message}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={(e) => submitBtn(e)}
          className={styles.submitBtn}
        >
          {loading ? "Sending" : "Send Now"}
          <span style={{ marginLeft: "5px" }}>
            {loading ? <CircularProgress size={10} /> : null}
          </span>
        </Button>
        {submit && (
          <span className={styles.contactMessage}>
            Thanks for reaching out! I'll get back to you soon.
          </span>
        )}
      </Box>
    </Box>
  );
};

export default ContactForm;
