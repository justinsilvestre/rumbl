defmodule Rumbl.UserTest do
  use Rumbl.ModelCase, async: true
  alias Rumbl.User

  @valid_attrs %{name: "A user", username: "eva", password: "supersecret"}
  @invalid_attrs %{}

  test "changeset with valid attributes" do
    changeset = User.changeset(%User{}, @valid_attrs)

    assert changeset.valid?
  end

  test "changeset with invalid attributes" do
    changeset = User.changeset(%User{}, @invalid_attrs)

    refute changeset.valid?
  end

  test "changeset does not accept long usernames" do
    attrs = Map.put(@valid_attrs, :username, String.duplicate("a", 40))

    assert {:username, "should be at most 20 character(s)"}
      in errors_on(%User{}, attrs)
  end

  test "registration password must be at least 6 characters long" do
    attrs = Map.put(@valid_attrs, :password, "12345")

    assert {:password, "should be at least 6 character(s)"}
      in errors_on(%User{}, attrs, :registration_changeset)
  end

  test "registration changeset with valid attributes hashes password" do
    changeset = User.registration_changeset(%User{}, @valid_attrs)
    %{password: pass, password_hash: pass_hash} = changeset.changes

    assert Comeonin.Bcrypt.checkpw(pass, pass_hash)
  end
end
