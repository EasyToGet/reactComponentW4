import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import * as bootstrap from "bootstrap";
import "./assets/style.css";
import LoginPage from "./pages/LoginPage";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  // modal 產品資料
  const productModalRef = useRef(null);
  const [modalType, setModalType] = useState("");
  const [tempProduct, setTempProduct] = useState({
    id: "",
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    is_enabled: false,
    imagesUrl: [],
  });

  useEffect(() => {}, [tempProduct]);

  //  開啟 Modal 欄位
  const openModal = (product, type) => {
    setTempProduct({
      id: product.id || "",
      imageUrl: product.imageUrl || "",
      title: product.title || "",
      category: product.category || "",
      unit: product.unit || "",
      origin_price: product.origin_price || "",
      price: product.price || "",
      description: product.description || "",
      content: product.content || "",
      is_enabled: product.is_enabled || false,
      imagesUrl: product.imagesUrl || [],
    });
    productModalRef.current.show();
    setModalType(type);
  };

  //  關閉 Modal 欄位
  const closeModal = () => {
    productModalRef.current.hide();
  };

  //  讀取 modal 資料
  const handleModalInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setTempProduct((prevProduct) => ({
      ...prevProduct,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  //  讀取圖片資料
  const handleImageChange = (index, value) => {
    setTempProduct((prevProduct) => {
      const newImages = [...prevProduct.imagesUrl];
      newImages[index] = value;

      if (
        value !== "" &&
        index === newImages.length - 1 &&
        newImages.length < 5
      ) {
        newImages.push("");
      }

      if (newImages.length > 1 && newImages[newImages.length - 1] === "") {
        newImages.pop();
      }
      
      return { ...prevProduct, imagesUrl: newImages};
    });
  }

  //  新增圖片
  const handleAddImage = () => {
    setTempProduct((prevProduct) => ({
      ...prevProduct,
      imagesUrl: [...prevProduct.imagesUrl, ""],
    }));
  };

  //  移除圖片
  const handleRemoveImage = () => {
    setTempProduct((prevProduct) => {
      const newImages = [...prevProduct.imagesUrl];
      newImages.pop();
      return {...prevProduct, imagesUrl: newImages};
    });
  };
  
  //  讀取 API 資料
  const [products, setProducts] = useState([]);
  const getProducts = async (page = 1) => {
    try {
      const res = await axios.get(`${BASE_URL}/v2/api/${API_PATH}/admin/products?page=${page}`);
      setProducts(res.data.products);
      setPageInfo(res.data.pagination);
    } catch (error) {
      console.error(error);
    }
  };

  //  更改產品資料
  const updateProducts = async (id) => {
    let product;
    if (modalType === 'edit') {
      product = `product/${id}`;
    } else {
      product = `product`;
    }

    const url = `${BASE_URL}/v2/api/${API_PATH}/admin/${product}`;

    const productData = {
      data: {
        ...tempProduct,
        origin_price: Number(tempProduct.origin_price),
        price: Number(tempProduct.price),
        is_enabled: tempProduct.is_enabled ? 1 : 0,
        imagesUrl: tempProduct.imagesUrl,
      },
    };

    try {
      let res;
      if (modalType === "edit") {
        res = await axios.put(url, productData);
        console.log("更新成功:", res.data);
      } else {
        res = await axios.post(url, productData);
        console.log("新增成功:", res.data);
      }

      productModalRef.current.hide();
      getProducts();
    } catch (error) {
      if (modalType === "edit") {
        console.error("更新失敗:", error.response.data.message);
      } else {
        console.error("新增失敗:", error.response.data.message);
      }
    }
  }

  //  刪除產品資料
  const delProducts = async (id) => {
    try {
      const res =await axios.delete(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${id}`
      );
      console.log("刪除成功:", res.data);
      productModalRef.current.hide();
      getProducts();
    } catch (error) {
      console.error("刪除失敗:", error.response.data.message);
    }
  }

  const [isAuth, setIsAuth] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  //  檢查登入
  const checkLogin = useCallback(async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false);
      console.error(error);
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("hexToken="))
      ?.split("=")[1];

    if (token) {
      axios.defaults.headers.common.Authorization = token;
      checkLogin();
    } else {
      setIsPageLoading(false);
    }
    
    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    });

    document.querySelector('#productModal').addEventListener('hide.bs.modal', () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
  }, [checkLogin]);

  const [pageInfo, setPageInfo] = useState({});

  const handlePageChange = (page) => {
    getProducts(page);
  }

  const handleFileChange = async (e) => {
    console.log(e.target);

    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file-to-upload", file);

    try {
      const res = await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/upload`, formData);
      const uploadedImageUrl = res.data.imageUrl;

      setTempProduct({
        ...tempProduct,
        imageUrl: uploadedImageUrl
      })
    } catch (error) {
      console.error("上傳失敗:", error.response.data.message);
    }
  }

  return (
    <>
    {isPageLoading ? "Loading..." : (isAuth ? (
      <div className="container">
        <h2>產品列表</h2>
        <div className="text-end mt-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => openModal("new")}
          >
            建立新產品
          </button>
        </div>
        <table className="table mt-4">
          <thead>
            <tr>
              <th width="120">分類</th>
              <th>產品名稱</th>
              <th width="120">原價</th>
              <th width="120">售價</th>
              <th width="100">是否啟用</th>
              <th width="120">編輯</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.category}</td>
                <td>{product.title}</td>
                <td className="text-end">{product.origin_price}</td>
                <td className="text-end">{product.price}</td>
                <td>
                  {product.is_enabled ? (
                    <span className="text-success">啟用</span>
                  ): (
                    <span>未啟用</span>
                  )}
                </td>
                <td>
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => openModal(product, "edit")}
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => openModal(product, "delete")}
                    >
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}       
          </tbody>
        </table>
        <div className="d-flex justify-content-center">
          <nav>
            <ul className="pagination">
              <li className={`page-item ${!pageInfo.has_pre && 'disabled'}`}>
                <a className="page-link" href="#" onClick={() => handlePageChange(pageInfo.current_page - 1)}>
                  上一頁
                </a>
              </li>

              {Array.from({ length: pageInfo.total_pages }).map((_, index) => (
                <li key={index} className={`page-item ${pageInfo.current_page === index +1 && 'active'}`}>
                  <a className="page-link" href="#" onClick={() => handlePageChange(index + 1)}>
                    {index + 1}
                  </a>
                </li>
              ))}

              <li className={`page-item ${!pageInfo.has_next && 'disabled'}`}>
                <a className="page-link" href="#" onClick={() => handlePageChange(pageInfo.current_page + 1)}>
                  下一頁
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    ) : <LoginPage getProducts={getProducts} setIsAuth={setIsAuth} />)}
    <div
      id="productModal"
      className="modal fade"
      tabIndex="-1"
      aria-labelledby="productModalLabel"
      aria-hidden="true"
      ref={productModalRef}
      >
      <div className="modal-dialog modal-xl">
        <div className="modal-content border-0">
          <div 
            className={`modal-header ${
              modalType === "delete" ? "bg-danger" : "bg-dark"
              } text-white`}
          >
            <h5 id="productModalLabel" className="modal-title">
              <span>
                {modalType === "delete"
                  ? "刪除產品"
                  : modalType === "edit"
                  ? "編輯產品"
                  : "新增產品"}
              </span>
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              ></button>
          </div>
          <div className="modal-body">
            {modalType === "delete" ? (
              <p className="h4">
                確定要刪除
                <span className="text-danger">{tempProduct.title}</span>
                嗎?
              </p>
            ) : (
              <div className="row">
                <div className="col-sm-4">
                  <div className="mb-2">
                    <div className="mb-5">
                      <label htmlFor="fileInput" className="form-label"> 圖片上傳 </label>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="form-control"
                        id="fileInput"
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入圖片網址
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="imageUrl"
                        placeholder="請輸入圖片連結"
                        value={tempProduct.imageUrl}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    {tempProduct.imageUrl ? (
                      <img
                        className="img-fluid"
                        src={tempProduct.imageUrl}
                        alt="主圖"
                      />
                    ): null}
                  </div>
                  <div>
                    {tempProduct.imagesUrl.map((image, index) => (
                      <div key={index} className="mb-2">
                        <input
                          type="text"
                          value={image}
                          onChange={(e) =>
                            handleImageChange(index, e.target.value)
                          }
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-preview mb-2"
                          />
                        )}
                      </div>
                    ))}

                    <div className="d-flex justify-content-between">
                      {tempProduct.imagesUrl.length < 5 &&
                        tempProduct.imagesUrl[
                          tempProduct.imagesUrl.length - 1
                        ] !== "" && (
                          <button
                            className="btn btn-outline-primary btn-sm w-100"
                            onClick={handleAddImage}
                          >
                            新增圖片
                          </button>
                        )}

                      {tempProduct.imagesUrl.length >= 1 && (
                        <button
                          className="btn btn-outline-danger btn-sm w-100"
                          onClick={handleRemoveImage}
                        >
                          取消圖片
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      id="title"
                      type="text"
                      className="form-control"
                      placeholder="請輸入標題"
                      value={tempProduct.title}
                      onChange={handleModalInputChange}
                    />
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">
                        分類
                      </label>
                      <input
                        id="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入分類"
                        value={tempProduct.category}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">
                        單位
                      </label>
                      <input
                        id="unit"
                        type="text"
                        className="form-control"
                        placeholder="請輸入單位"
                        value={tempProduct.unit}
                        onChange={handleModalInputChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        id="origin_price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入原價"
                        value={tempProduct.origin_price}
                        onChange={handleModalInputChange}
                      />
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        id="price"
                        type="number"
                        min="0"
                        className="form-control"
                        placeholder="請輸入售價"
                        value={tempProduct.price}
                        onChange={handleModalInputChange}
                      />
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      id="description"
                      className="form-control"
                      placeholder="請輸入產品描述"
                      value={tempProduct.description}
                      onChange={handleModalInputChange}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      id="content"
                      className="form-control"
                      placeholder="請輸入說明內容"
                      value={tempProduct.content}
                      onChange={handleModalInputChange}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        id="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={tempProduct.is_enabled}
                        onChange={handleModalInputChange}
                      />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              data-bs-dismiss="modal"
              onClick={() => closeModal()}
            >
              取消
            </button>
            {modalType === "delete" ? (
              <div>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => delProducts(tempProduct.id)}
                >
                  刪除
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => updateProducts(tempProduct.id)}
              >
                確認
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
  );
}

export default App
