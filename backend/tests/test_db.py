from backend.lib.db import Database


class MongoDatabaseStub:
    def __bool__(self):
        raise AssertionError("Mongo database objects must not be truth-tested")

    def __getitem__(self, name):
        return f"mongo-collection:{name}"


def test_mongo_collection_selection_does_not_truth_test_database():
    database = Database()
    database.is_mongo = True
    database._mongo_db = MongoDatabaseStub()

    assert database.get_collection("users") == "mongo-collection:users"
