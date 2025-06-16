import React, { useEffect, useState, useCallback, useRef } from 'react';
import { db, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, arrayUnion, getDoc, setDoc } from './firebase';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Spinner, Form, Modal, Nav } from 'react-bootstrap';

const EventsClubsPage = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemData, setItemData] = useState({});
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bulkIds, setBulkIds] = useState('');
  const [imageUrls, setImageUrls] = useState({});

  const storage = getStorage();
  const imageUrlsRef = useRef({});

  const tabs = ["events", "clubs", "FineArts", "tutor", "athletics", "event_participants"];

  const getImageURL = useCallback(async (imagePath) => {
    if (imageUrlsRef.current[imagePath]) return;
    try {
      const imageRef = ref(storage, imagePath);
      const url = await getDownloadURL(imageRef);
      imageUrlsRef.current[imagePath] = url;
      setImageUrls(prev => ({ ...prev, [imagePath]: url }));
    } catch (error) {
      console.error("Error fetching image URL:", error);
    }
  }, [storage]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "event_participants") {
        const docSnap = await getDoc(doc(db, "event_participants", "approved_ids"));
        const ids = docSnap.exists() ? docSnap.data()?.ids || [] : [];
        setItems(ids.map(id => ({ id })));
      } else {
        const querySnapshot = await getDocs(collection(db, activeTab));
        const newItems = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          newItems.push({ id: doc.id, ...data });
          if (data.img) getImageURL(data.img);
        });
        setItems(newItems);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError(`Error loading ${activeTab}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab, db, getImageURL]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleBulkIdsChange = (e) => setBulkIds(e.target.value);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setItemData({});
    setEditingItem(null);
    setShowModal(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const updatedItemData = {
        ...itemData,
        type: (activeTab === "clubs" || activeTab === "FineArts" || activeTab === "tutor") ? "school" :
              (activeTab === "events" || activeTab === "athletics") ? "volunteer" :
              itemData.type || ""
      };

      if (activeTab === "event_participants") {
        const docRef = doc(db, "event_participants", "approved_ids");
        const docSnap = await getDoc(docRef);
        const newId = Number(updatedItemData.id);
        if (docSnap.exists()) {
          const existingIds = docSnap.data()?.ids || [];
          if (!existingIds.includes(newId)) {
            await updateDoc(docRef, { ids: arrayUnion(newId) });
            setItems([...items, { id: newId }]);
          } else {
            alert("ID already exists.");
          }
        } else {
          await setDoc(docRef, { ids: [newId] });
          setItems([...items, { id: newId }]);
        }
      } else {
        // prevent duplicates for tutor
        if (activeTab === "tutor") {
          const isDuplicate = items.some(item =>
            item.name?.toLowerCase() === updatedItemData.name?.toLowerCase() &&
            item.mail?.toLowerCase() === updatedItemData.mail?.toLowerCase() &&
            item.subject?.toLowerCase() === updatedItemData.subject?.toLowerCase()
          );
          if (isDuplicate) {
            alert("Duplicate tutor detected!");
            return;
          }
        }

        if (editingItem) {
          await updateDoc(doc(db, activeTab, editingItem.id), updatedItemData);
          const updatedItems = items.map(item => item.id === editingItem.id ? { ...item, ...updatedItemData } : item);
          setItems(updatedItems);
        } else {
          const docRef = await addDoc(collection(db, activeTab), updatedItemData);
          setItems([...items, { id: docRef.id, ...updatedItemData }]);
        }
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(`Error adding/updating ${activeTab}`);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      if (activeTab === "event_participants") {
        const docRef = doc(db, "event_participants", "approved_ids");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const updatedIds = docSnap.data()?.ids.filter(i => i !== id);
          await setDoc(docRef, { ids: updatedIds });
          setItems(items.filter(item => item.id !== id));
        }
      } else {
        await deleteDoc(doc(db, activeTab, id));
        setItems(items.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error(err);
      setError(`Error deleting ${activeTab}`);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemData(item);
    setShowModal(true);
  };

  return (
    <Container>
      <Nav variant="tabs" activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)}>
        {tabs.map(tab => <Nav.Item key={tab}><Nav.Link eventKey={tab}>{tab}</Nav.Link></Nav.Item>)}
      </Nav>

      <Button className="mt-3 mb-3" onClick={() => setShowModal(true)}>
        {editingItem ? "Edit" : "Add"} {activeTab}
      </Button>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Row>
          {items.map((item) => (
            <Col key={item.id} sm={12} md={6} lg={4}>
              <Card className="mb-3">
                {item.img && (
                  <Card.Img variant="top" src={imageUrlsRef.current[item.img] || ''} />
                )}
                <Card.Body>
                  <Card.Title>{item.name || item.id}</Card.Title>
                  <Card.Text>{item.description || item.desc || ''}</Card.Text>
                  {activeTab === "tutor" && (
                    <>
                      <Card.Text><strong>Subject:</strong> {item.subject}</Card.Text>
                      <Card.Text><strong>Email:</strong> {item.mail || item.email}</Card.Text>
                      <Card.Text><strong>Instagram:</strong> {item.instagram}</Card.Text>
                    </>
                  )}
                  {activeTab !== "tutor" && (
                    <>
                      <Card.Text><strong>Website:</strong> {item.website}</Card.Text>
                      <Card.Text><strong>Date:</strong> {item.date}</Card.Text>
                    </>
                  )}
                  <Button variant="warning" size="sm" onClick={() => handleEditItem(item)}>Edit</Button>{' '}
                  <Button variant="danger" size="sm" onClick={() => handleDeleteItem(item.id)}>Delete</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Modal Form */}
      <Modal show={showModal} onHide={resetForm}>
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? "Edit" : "Add"} {activeTab}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddItem}>
            {activeTab === "event_participants" ? (
              <Form.Group>
                <Form.Label>ID</Form.Label>
                <Form.Control type="number" name="id" value={itemData.id || ''} onChange={handleChange} required />
              </Form.Group>
            ) : (
              <>
                <Form.Group>
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" name="name" value={itemData.name || ''} onChange={handleChange} required />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" name="description" value={itemData.description || itemData.desc || ''} onChange={handleChange} />
                </Form.Group>
                {activeTab === "tutor" && (
                  <>
                    <Form.Group>
                      <Form.Label>Subject</Form.Label>
                      <Form.Control type="text" name="subject" value={itemData.subject || ''} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" name="mail" value={itemData.mail || itemData.email || ''} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Instagram</Form.Label>
                      <Form.Control type="text" name="instagram" value={itemData.instagram || ''} onChange={handleChange} />
                    </Form.Group>
                  </>
                )}
                {activeTab !== "tutor" && (
                  <>
                    <Form.Group>
                      <Form.Label>Website</Form.Label>
                      <Form.Control type="text" name="website" value={itemData.website || ''} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control type="text" name="date" value={itemData.date || ''} onChange={handleChange} />
                    </Form.Group>
                  </>
                )}
              </>
            )}
            <Button type="submit" variant="primary" className="mt-3">{editingItem ? 'Save Changes' : 'Add Item'}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default EventsClubsPage;
