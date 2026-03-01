"""文件夹仓储测试。"""
from datetime import datetime, timezone

import pytest

from src.persistence.models import Folder
from src.persistence.folder_repo import SqliteFolderRepository, _row_to_folder


@pytest.fixture
def folder_repo(temp_db_path: str) -> SqliteFolderRepository:
    """创建使用临时数据库的文件夹仓储。"""
    return SqliteFolderRepository(db_path=temp_db_path)


class TestRowToFolder:
    """_row_to_folder 辅助函数测试。"""

    def test_convert_row_to_folder(self) -> None:
        """测试：将数据库行转换为 Folder 对象。"""
        row = ("f1", "Work", "#60A5FA", "2024-01-01T00:00:00+00:00", 0)
        folder = _row_to_folder(row)
        assert folder.id == "f1"
        assert folder.name == "Work"
        assert folder.color == "#60A5FA"
        assert folder.sort_order == 0


class TestSqliteFolderRepository:
    """SQLite 文件夹仓储测试。"""

    def test_create_folder(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：创建文件夹。"""
        folder = folder_repo.create("工作", "#34D399")
        assert folder.name == "工作"
        assert folder.color == "#34D399"
        assert folder.sort_order == 1  # 第一个文件夹是 1
        # 时间戳应该是有效的 ISO 格式
        datetime.fromisoformat(folder.created_at.replace("Z", "+00:00"))

    def test_create_folder_default_color(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：创建文件夹使用默认颜色。"""
        folder = folder_repo.create("默认")
        assert folder.color == "#60A5FA"  # 默认蓝色

    def test_create_multiple_folders(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：创建多个文件夹，sort_order 递增。"""
        f1 = folder_repo.create("A")
        f2 = folder_repo.create("B")
        f3 = folder_repo.create("C")
        assert f1.sort_order == 1
        assert f2.sort_order == 2
        assert f3.sort_order == 3

    def test_list_folders_empty(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：空列表。"""
        folders = folder_repo.list_folders()
        assert folders == []

    def test_list_folders_ordered_by_sort_order(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：文件夹按 sort_order 升序排列。"""
        folder_repo.create("第三")
        folder_repo.create("第一")
        folder_repo.create("第二")

        folders = folder_repo.list_folders()
        assert len(folders) == 3
        assert folders[0].name == "第三"
        assert folders[1].name == "第一"
        assert folders[2].name == "第二"

    def test_get_by_id_exists(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：获取存在的文件夹。"""
        created = folder_repo.create("测试")
        found = folder_repo.get_by_id(created.id)
        assert found is not None
        assert found.id == created.id
        assert found.name == "测试"

    def test_get_by_id_not_exists(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：获取不存在的文件夹返回 None。"""
        found = folder_repo.get_by_id("nonexistent")
        assert found is None

    def test_update_name(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：更新文件夹名称。"""
        folder = folder_repo.create("旧名称")
        folder_repo.update_name(folder.id, "新名称")

        updated = folder_repo.get_by_id(folder.id)
        assert updated is not None
        assert updated.name == "新名称"

    def test_update_color(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：更新文件夹颜色。"""
        folder = folder_repo.create("测试")
        folder_repo.update_color(folder.id, "#F87171")

        updated = folder_repo.get_by_id(folder.id)
        assert updated is not None
        assert updated.color == "#F87171"

    def test_update_sort_order(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：更新文件夹排序序号。"""
        f1 = folder_repo.create("A")
        f2 = folder_repo.create("B")
        folder_repo.update_sort_order(f2.id, 0)

        folders = folder_repo.list_folders()
        assert len(folders) == 2
        # f2 现在应该排在前面
        assert folders[0].id == f2.id
        assert folders[1].id == f1.id

    def test_delete_folder(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：删除文件夹。"""
        folder = folder_repo.create("待删除")
        folder_repo.delete(folder.id)

        found = folder_repo.get_by_id(folder.id)
        assert found is None

    def test_delete_nonexistent_is_noop(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：删除不存在的文件夹不报错。"""
        # 不应该抛出异常
        folder_repo.delete("nonexistent")

    def test_set_folder_collapsed(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：设置文件夹折叠状态。"""
        folder = folder_repo.create("测试")
        folder_repo.set_folder_collapsed(folder.id, True)

        assert folder_repo.is_folder_collapsed(folder.id) is True

        folder_repo.set_folder_collapsed(folder.id, False)
        assert folder_repo.is_folder_collapsed(folder.id) is False

    def test_is_folder_collapsed_default_false(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：文件夹默认不折叠。"""
        folder = folder_repo.create("测试")
        assert folder_repo.is_folder_collapsed(folder.id) is False

    def test_list_after_delete(self, folder_repo: SqliteFolderRepository) -> None:
        """测试：删除后列表更新。"""
        f1 = folder_repo.create("保留")
        f2 = folder_repo.create("删除")
        folder_repo.delete(f2.id)

        folders = folder_repo.list_folders()
        assert len(folders) == 1
        assert folders[0].id == f1.id
