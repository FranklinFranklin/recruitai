ALTER TABLE "candidates" ADD COLUMN "skills" text[];--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "years_of_experience" integer;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "matched_vacancy_id" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "match_score" integer;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "match_reasoning" text;