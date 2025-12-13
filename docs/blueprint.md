# **App Name**: EventiCheck

## Core Features:

- Admin Authentication: Secure email/password login for admin user.
- Organizer Creation: Admin function to register event organizers with email and password.
- Registration Link Generation: Generate unique registration links with defined event categories (VIP, Guest, Speaker, etc.).
- Public Registration Form: Collect participant details (Full Name, Email, Phone, Category) via a public form.
- Digital ID Card Generation: Automatically generate digital identity cards with a unique QR code, retrievable from the Firebase database.
- QR Code Scan Tool: Built-in QR code scanner to check-in participants for lunch, dinner and general event entry/exit, with duplicate scan prevention, managed by an AI tool.
- Check-in Tracking and Reporting: Track and report check-in status per participant with time-stamped records and activity logs using Firestore.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey professionalism and trust in event management.
- Background color: Light blue-gray (#ECEFF1) for a clean, unobtrusive backdrop.
- Accent color: A vibrant violet (#9575CD) to draw the user's eye to CTAs and interactive elements.
- Headline font: 'Space Grotesk' sans-serif, for headlines; Body font: 'Inter' sans-serif, for body text.
- Consistent use of material design icons for intuitive navigation and quick understanding of features.
- Dashboard layout: Use a grid-based layout for a clear, organized presentation of event data and management tools.
- Use subtle transitions and loading animations to improve user experience. Examples include animated progress bars when uploading or processing data, page transitions, or appearing/disappearing sidebars or widgets.