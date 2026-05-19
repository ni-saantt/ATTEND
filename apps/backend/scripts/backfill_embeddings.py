#!/usr/bin/env python3
"""
Backfill face embeddings for students who have images but no embeddings.
Prefer using the desktop app "Generate embeddings" button instead.
Run from backend dir: python scripts/backfill_embeddings.py [--college-id UUID]
"""
import argparse
import sys

sys.path.insert(0, ".")
from app.db.supabase import get_supabase
from app.services.embedding_backfill import generate_embeddings_for_college


def main():
    parser = argparse.ArgumentParser(description="Backfill face embeddings for students with images")
    parser.add_argument("--college-id", help="Limit to specific college UUID")
    args = parser.parse_args()

    supabase = get_supabase()
    if args.college_id:
        colleges = [{"id": args.college_id}]
    else:
        colleges = supabase.table("colleges").select("id").execute().data or []

    for c in colleges:
        cid = str(c["id"])
        print(f"Processing college {cid}...")
        res = generate_embeddings_for_college(cid)
        print(f"  Generated: {res['generated']}, Skipped: {res['skipped']}")
        if res.get("failed"):
            for f in res["failed"]:
                print(f"  Failed: {f}")
    print("Done.")


if __name__ == "__main__":
    main()
