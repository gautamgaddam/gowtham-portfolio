import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import Link from "next/link";
import Head from "next/head";

const FeatureRow = ({ included, text }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
    {included ? (
      <CheckCircleIcon sx={{ color: "#66bb6a", fontSize: 20 }} />
    ) : (
      <CancelIcon sx={{ color: "#bbb", fontSize: 20 }} />
    )}
    <Typography
      variant="body2"
      sx={{
        color: included ? "#fff" : "#888",
        fontWeight: included ? 500 : 400,
      }}
    >
      {text}
    </Typography>
  </Box>
);

const tiers = [
  {
    name: "FREE",
    price: "$0",
    period: "/month",
    features: [
      { text: "Portfolio Builder", included: true },
      { text: "Public /u/username page", included: true },
      { text: "Up to 5 projects", included: true },
      { text: "Health Coach", included: false },
      { text: "Music Studio", included: false },
      { text: "Priority support", included: false },
    ],
    cta: { label: "Get Started Free", href: "/auth/signup", disabled: false },
    border: "3px solid #000",
    boxShadow: "6px 6px #000",
    popular: false,
  },
  {
    name: "PRO",
    price: "$9",
    period: "/month",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Health Coach (AI-powered)", included: true },
      { text: "Music Studio", included: true },
      { text: "Up to 20 projects", included: true },
      { text: "Email support", included: true },
      { text: "Priority support", included: false },
    ],
    cta: { label: "Coming Soon", href: null, disabled: true },
    border: "4px solid #66bb6a",
    boxShadow: "8px 8px #66bb6a",
    popular: true,
  },
  {
    name: "PREMIUM",
    price: "$15",
    period: "/month",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Custom domain support", included: true },
      { text: "Priority support", included: true },
      { text: "Early access to new features", included: true },
    ],
    cta: { label: "Coming Soon", href: null, disabled: true },
    border: "4px solid #000",
    boxShadow: "6px 6px #000",
    popular: false,
  },
];

const faqs = [
  {
    q: "What happens to my portfolio if I downgrade?",
    a: "Your portfolio stays active, but it will be limited to 5 projects. Any projects beyond the limit will be hidden until you upgrade again.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel anytime from your dashboard settings. There are no lock-in contracts or cancellation fees.",
  },
  {
    q: "Is the Health Coach HIPAA compliant?",
    a: "The Health Coach provides general wellness guidance only and is not intended as medical advice. It is not a HIPAA-covered service.",
  },
  {
    q: "When will Pro/Premium be available?",
    a: "We're launching soon! Sign up for a free account to be notified as soon as paid plans go live.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing — Gowtham Portfolio</title>
        <meta
          name="description"
          content="Choose a plan that fits your needs. Start free, upgrade when you're ready."
        />
      </Head>

      {/* Page Header */}
      <Box
        sx={{
          backgroundColor: "#121212",
          borderBottom: "4px solid #000",
          boxShadow: "0 4px 0 #66bb6a",
          py: { xs: 5, md: 7 },
          textAlign: "center",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-1px",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            Choose Your Plan
          </Typography>
          <Typography variant="h6" sx={{ color: "#aaa", fontWeight: 400 }}>
            Start free. Upgrade when you&apos;re ready.
          </Typography>
        </Container>
      </Box>

      {/* Pricing Cards */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="stretch"
        >
          {tiers.map((tier) => (
            <Grid item xs={12} md={4} key={tier.name}>
              <Box
                sx={{
                  border: tier.border,
                  boxShadow: tier.boxShadow,
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "#1a1a1a",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                }}
              >
                {/* Most Popular badge */}
                {tier.popular && (
                  <Box
                    sx={{
                      backgroundColor: "#66bb6a",
                      color: "#000",
                      textAlign: "center",
                      py: 0.75,
                      fontWeight: 900,
                      fontSize: "0.8rem",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                    }}
                  >
                    Most Popular
                  </Box>
                )}

                <Box sx={{ p: 3, flexGrow: 1 }}>
                  {/* Tier name */}
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.85rem",
                      letterSpacing: "2px",
                      color: tier.popular ? "#66bb6a" : "#fff",
                    }}
                  >
                    {tier.name}
                  </Typography>

                  {/* Price */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      mt: 1,
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 900, color: "#fff", lineHeight: 1 }}
                    >
                      {tier.price}
                    </Typography>
                    <Typography variant="body1" sx={{ color: "#888", ml: 0.5 }}>
                      {tier.period}
                    </Typography>
                  </Box>

                  {/* Features */}
                  <Box sx={{ mb: 3 }}>
                    {tier.features.map((f) => (
                      <FeatureRow
                        key={f.text}
                        included={f.included}
                        text={f.text}
                      />
                    ))}
                  </Box>
                </Box>

                {/* CTA Button */}
                <Box sx={{ p: 3, pt: 0 }}>
                  {tier.cta.disabled ? (
                    <Button
                      variant="contained"
                      disabled
                      fullWidth
                      sx={{
                        border: "3px solid #555",
                        borderRadius: "6px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        py: 1.25,
                        "&.Mui-disabled": {
                          backgroundColor: "#333",
                          color: "#666",
                          border: "3px solid #555",
                        },
                      }}
                    >
                      {tier.cta.label}
                    </Button>
                  ) : (
                    <Link
                      href={tier.cta.href}
                      passHref
                      style={{ textDecoration: "none" }}
                    >
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: "#66bb6a",
                          color: "#000",
                          border: "3px solid #000",
                          borderRadius: "6px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          boxShadow: "4px 4px #000",
                          py: 1.25,
                          "&:hover": {
                            backgroundColor: "#81c784",
                            boxShadow: "2px 2px #000",
                            transform: "translate(2px, 2px)",
                          },
                        }}
                      >
                        {tier.cta.label}
                      </Button>
                    </Link>
                  )}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* FAQ Section */}
        <Box sx={{ mt: { xs: 8, md: 10 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: "#fff",
              textTransform: "uppercase",
              mb: 4,
              textAlign: "center",
              letterSpacing: "-0.5px",
            }}
          >
            Frequently Asked Questions
          </Typography>

          {faqs.map((faq, i) => (
            <Accordion
              key={i}
              sx={{
                backgroundColor: "#1a1a1a",
                border: "3px solid #000",
                boxShadow: "4px 4px #000",
                borderRadius: "6px !important",
                mb: 2,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "#66bb6a" }} />}
                sx={{
                  "& .MuiAccordionSummary-content": { my: 1 },
                }}
              >
                <Typography sx={{ fontWeight: 700, color: "#fff" }}>
                  {faq.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ borderTop: "2px solid #333", pt: 2 }}>
                <Typography sx={{ color: "#aaa" }}>{faq.a}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </>
  );
}
