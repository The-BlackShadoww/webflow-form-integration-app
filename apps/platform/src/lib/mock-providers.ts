export const MOCK_DESTINATIONS: Record<string, Array<{ id: string; name: string }>> = {
  mailchimp: [
    { id: "list-aud-001", name: "Newsletter Subscribers" },
    { id: "list-aud-002", name: "Product Updates" },
    { id: "list-aud-003", name: "Beta Testers" },
  ],
  slack: [
    { id: "C0001", name: "#general" },
    { id: "C0002", name: "#leads" },
    { id: "C0003", name: "#contact-us" },
  ],
  hubspot: [
    { id: "form-hub-001", name: "Contact Us Form" },
    { id: "form-hub-002", name: "Newsletter Signup" },
  ],
  notion: [
    { id: "db-not-001", name: "Leads Database" },
    { id: "db-not-002", name: "Customer CRM" },
  ],
  airtable: [
    { id: "tbl-air-001", name: "Leads / Contacts" },
    { id: "tbl-air-002", name: "Newsletter / Subscribers" },
  ],
  "google-sheet": [
    { id: "sheet-001", name: "Leads — Sheet1" },
    { id: "sheet-002", name: "Subscribers — Sheet1" },
  ],
  klaviyo: [
    { id: "klav-001", name: "Newsletter" },
    { id: "klav-002", name: "VIP Customers" },
  ],
  brevo: [{ id: "brev-001", name: "Contacts" }],
  "mailer-lite": [{ id: "ml-001", name: "Subscribers" }],
  "email-octopus": [{ id: "eo-001", name: "Main List" }],
  moosend: [{ id: "moo-001", name: "Main Mailing List" }],
  omnisend: [{ id: "om-001", name: "Newsletter" }],
  sender: [{ id: "snd-001", name: "Subscribers" }],
  activecampaign: [{ id: "ac-001", name: "Master List" }],
  "constant-contact": [{ id: "cc-001", name: "General List" }],
  getresponse: [{ id: "gr-001", name: "Newsletter" }],
  discord: [{ id: "guild-001", name: "Flowappz / #leads" }],
};

export const MOCK_FIELDS: Record<string, Array<{ id: string; name: string }>> = {
  mailchimp: [
    { id: "EMAIL", name: "Email" },
    { id: "FNAME", name: "First Name" },
    { id: "LNAME", name: "Last Name" },
    { id: "PHONE", name: "Phone" },
    { id: "COMPANY", name: "Company" },
  ],
  hubspot: [
    { id: "email", name: "Email" },
    { id: "firstname", name: "First Name" },
    { id: "lastname", name: "Last Name" },
    { id: "phone", name: "Phone" },
    { id: "company", name: "Company" },
    { id: "message", name: "Message" },
  ],
  notion: [
    { id: "title", name: "Name (title)" },
    { id: "email", name: "Email" },
    { id: "phone", name: "Phone" },
    { id: "message", name: "Message" },
  ],
  airtable: [
    { id: "Email", name: "Email" },
    { id: "Name", name: "Name" },
    { id: "Phone", name: "Phone" },
    { id: "Notes", name: "Notes" },
  ],
};

export const channelOnlyFields = (label: string) => [{ id: "text", name: `${label} message text` }];
