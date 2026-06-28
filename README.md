# Mascot Forge

Mascot Forge was built for the **YC Hackathon by Orange Slice** in the
**Zero to One: AI-Enhanced PLG & Onboarding** track by **Cristian Dinuta** and
**Mulyn Kim**.

Mascot Forge takes an app from the App Store and personalizes a mascot around
that product's brand, purpose, audience, and visual identity.

It is a zero-to-one playbook for taking that mascot from an initial product idea
to a consistent, integration-ready character system. Instead of producing a
single illustration, Mascot Forge defines the mascot's visual direction,
generates a reusable model sheet, creates animated assets, and packages the
results for use throughout a product.

We applied the playbook to [Welo Finance](https://welofinance.com), our finance
app available on the App Store.

## Stack

- **Frontend:** React, TypeScript, Vite, and Tailwind CSS, deployed and hosted
  on **Vercel**
- **Backend and storage:** **Convex**, including server functions, generated
  asset storage, and asynchronous animation jobs
- **AI image generation:** the **Gemini API** using Gemini Flash for mascot and
  pose generation
- **Animation:** **Higgsfield** image-to-video generation
- **Secrets:** Gemini and Higgsfield API keys are stored in Convex and are never
  exposed to the frontend

## Product Flow

1. **Add the app:** provide an App Store URL so Mascot Forge can understand the
   product, category, and brand context.
2. **Set the direction:** choose the mascot's form, personality, visual style,
   dimensionality, and color direction.
3. **Generate and refine:** create mascot concepts and iterate until one
   character is approved.
4. **Build the model sheet:** select standard or custom actions and generate
   consistent transparent PNG poses from the approved mascot.
5. **Add motion:** animate individual poses into reusable product-ready videos.
6. **Export and integrate:** download the PNG, MP4, and MOV assets, with an
   optional structured specification for developers.

The purpose is to make mascot creation repeatable rather than treating it as a
one-off branding exercise. The output becomes a practical system for onboarding,
empty states, celebrations, guidance, reminders, social content, and other
product moments.

## Growth and Virality

Mascots give products a recognizable character that users can build an emotional
connection with. That character can turn routine product events—completing a
goal, reaching a streak, sharing progress, or inviting a friend—into visual
moments that people are more likely to share.

This creates a product-led growth loop:

**use the product → achieve a meaningful moment → receive a personalized mascot
reaction → share it → introduce new users to the product**

Because the same mascot remains visually consistent across poses and animation,
every shared asset reinforces brand recognition. Mascot Forge makes this loop
repeatable across products by supplying both the character assets and a clear
playbook for where and how the mascot should appear.

## Zero-to-One Mascot Playbook

Mascot Forge is more than an asset generator. It provides a structured path for
deciding:

- what the mascot represents within the product;
- how its personality and appearance connect to the brand;
- which poses and reactions support key user moments;
- how motion should be introduced without changing the character;
- how the final assets should be exported and integrated consistently.

The result is a mascot system that can move from concept to onboarding and
product integration without requiring teams to invent the process from scratch.

## Stretch Feature

A natural next step is automatic social-video generation. Since the mascots and
their movements are already generated and animation-ready, Mascot Forge could
combine them with hooks, captions, product footage, voiceover, and templates to
produce different TikToks and short-form videos. This would turn the same mascot
system used inside the product into an efficient, repeatable social acquisition
channel.
