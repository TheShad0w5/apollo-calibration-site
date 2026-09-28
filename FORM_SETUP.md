# Apollo inquiry delivery

The homepage posts directly to https://formsubmit.co/keith@acalibrations.com.
No API key or email password is stored in this repository. The form uses native browser validation, FormSubmit's default CAPTCHA, and a hidden honeypot field. The visitor's email is used for replies. The provider handles submission confirmation; the website does not claim a message was delivered locally.

## One-time activation and delivery check

1. Open https://www.acalibrations.com/#contact after deployment.
2. Fill out the form with your own contact details and clearly label the message as a website test.
3. Submit and complete the provider's verification step if requested.
4. Open the activation email sent to keith@acalibrations.com and confirm the form. Check spam if needed.
5. Submit a second test and verify it arrives in Keith's inbox with the vehicle details. Use Reply to confirm the reply address is the address entered on the form.

Delivery is not considered verified until step 5 succeeds. Keep the visible direct email link as a fallback.

Documentation: https://formsubmit.co/

## Page styles

The consumer homepage uses etuning.css. The existing style.css remains untouched for the knowledge base and legacy service pages. Publishing requires no build command; retain the existing Vercel project settings.
