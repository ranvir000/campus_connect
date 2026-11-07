import os
import json
import sqlite3
import asyncio
from typing import Any, Dict, List, Optional

MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "campusconnect")

# SQLite fallback implementation for zero-dependency local runs
class SQLiteCollection:
    def __init__(self, db_path: str, name: str):
        self.db_path = db_path
        self.name = name
        self._init_table()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_table(self):
        with self._get_conn() as conn:
            conn.execute(
                f"""CREATE TABLE IF NOT EXISTS {self.name} (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL
                )"""
            )
            conn.commit()

    async def create_index(self, keys, **kwargs):
        # Indexes handled transparently in SQLite
        return None

    def _matches(self, doc: dict, query: dict) -> bool:
        for k, v in query.items():
            if k == "$or":
                if not any(self._matches(doc, sub) for sub in v):
                    return False
            elif isinstance(v, dict):
                # Simple operators
                if "$in" in v and doc.get(k) not in v["$in"]:
                    return False
                if "$ne" in v and doc.get(k) == v["$ne"]:
                    return False
            elif doc.get(k) != v:
                return False
        return True

    async def find_one(self, query: Optional[dict] = None) -> Optional[dict]:
        query = query or {}
        if "id" in query and len(query) == 1:
            with self._get_conn() as conn:
                cur = conn.execute(f"SELECT data FROM {self.name} WHERE id = ?", (query["id"],))
                row = cur.fetchone()
                if row:
                    return json.loads(row["data"])
                return None

        # General scan
        with self._get_conn() as conn:
            cur = conn.execute(f"SELECT data FROM {self.name}")
            for row in cur:
                doc = json.loads(row["data"])
                if self._matches(doc, query):
                    return doc
        return None

    def find(self, query: Optional[dict] = None):
        return SQLiteCursor(self, query or {})

    async def insert_one(self, doc: dict):
        doc_copy = dict(doc)
        doc_id = str(doc_copy.get("id"))
        doc_json = json.dumps(doc_copy)
        with self._get_conn() as conn:
            conn.execute(
                f"INSERT OR REPLACE INTO {self.name} (id, data) VALUES (?, ?)",
                (doc_id, doc_json),
            )
            conn.commit()
        return type("InsertResult", (), {"inserted_id": doc_id})()

    async def update_one(self, query: dict, update: dict):
        doc = await self.find_one(query)
        if not doc:
            return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()

        if "$set" in update:
            doc.update(update["$set"])
        if "$push" in update:
            for field, val in update["$push"].items():
                if field not in doc or not isinstance(doc[field], list):
                    doc[field] = []
                doc[field].append(val)

        await self.insert_one(doc)
        return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()

    async def delete_one(self, query: dict):
        doc = await self.find_one(query)
        if not doc:
            return type("DeleteResult", (), {"deleted_count": 0})()
        with self._get_conn() as conn:
            conn.execute(f"DELETE FROM {self.name} WHERE id = ?", (doc["id"],))
            conn.commit()
        return type("DeleteResult", (), {"deleted_count": 1})()

    async def delete_many(self, query: dict):
        cursor = self.find(query)
        docs = await cursor.to_list(10000)
        with self._get_conn() as conn:
            for doc in docs:
                conn.execute(f"DELETE FROM {self.name} WHERE id = ?", (doc["id"],))
            conn.commit()
        return type("DeleteResult", (), {"deleted_count": len(docs)})()

    async def count_documents(self, query: Optional[dict] = None) -> int:
        cursor = self.find(query or {})
        docs = await cursor.to_list(10000)
        return len(docs)


class SQLiteCursor:
    def __init__(self, collection: SQLiteCollection, query: dict):
        self.collection = collection
        self.query = query
        self._sort_key = None
        self._sort_dir = 1
        self._limit = None

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            self._sort_key = key_or_list[0][0]
            self._sort_dir = key_or_list[0][1]
        else:
            self._sort_key = key_or_list
            self._sort_dir = direction
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    async def to_list(self, length: Optional[int] = None) -> List[dict]:
        with self.collection._get_conn() as conn:
            cur = conn.execute(f"SELECT data FROM {self.collection.name}")
            results = []
            for row in cur:
                doc = json.loads(row["data"])
                if self.collection._matches(doc, self.query):
                    results.append(doc)

        if self._sort_key:
            results.sort(
                key=lambda x: x.get(self._sort_key, ""),
                reverse=(self._sort_dir == -1),
            )

        limit_val = self._limit if self._limit is not None else length
        if limit_val is not None:
            results = results[:limit_val]

        return results


class Database:
    def __init__(self):
        self._mongo_client = None
        self._mongo_db = None
        self._sqlite_path = os.path.join(os.path.dirname(__file__), "..", "campusconnect.db")
        self._collections = {}
        self.is_mongo = False

    async def init(self):
        if MONGO_URL:
            try:
                import motor.motor_asyncio
                self._mongo_client = motor.motor_asyncio.AsyncIOMotorClient(
                    MONGO_URL, serverSelectionTimeoutMS=2000
                )
                await self._mongo_client.server_info()
                self._mongo_db = self._mongo_client[DB_NAME]
                self.is_mongo = True
                print(f"[Database] Connected to MongoDB ({DB_NAME})")
                return
            except Exception as e:
                print(f"[Database] MongoDB connection failed ({e}), using embedded SQLite fallback")

        # Fallback to local SQLite
        self.is_mongo = False
        print(f"[Database] Using local embedded SQLite database at {self._sqlite_path}")

    def get_collection(self, name: str):
        if self.is_mongo and self._mongo_db:
            return self._mongo_db[name]
        if name not in self._collections:
            self._collections[name] = SQLiteCollection(self._sqlite_path, name)
        return self._collections[name]

    # Shorthand properties for collections
    @property
    def users(self):
        return self.get_collection("users")

    @property
    def sessions(self):
        return self.get_collection("sessions")

    @property
    def subjects(self):
        return self.get_collection("subjects")

    @property
    def timetable(self):
        return self.get_collection("timetable")

    @property
    def assignments(self):
        return self.get_collection("assignments")

    @property
    def notices(self):
        return self.get_collection("notices")

    @property
    def events(self):
        return self.get_collection("events")

    @property
    def event_registrations(self):
        return self.get_collection("event_registrations")

    @property
    def resources(self):
        return self.get_collection("resources")

    @property
    def support_tickets(self):
        return self.get_collection("support_tickets")


db = Database()
