ALTER TABLE "customers" ADD COLUMN "facebook_subject" varchar(255);--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_facebook_subject_unique" UNIQUE("facebook_subject");