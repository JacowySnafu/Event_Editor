import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  db, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, arrayUnion, getDoc, setDoc
} from './firebase';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Container, Row, Col, Card, Button, Spinner, Form, Modal, Nav
} from 'react-bootstrap';

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

  const handleBulkIdsChange = (e) => setBulkIds(e.target.value);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    const ids = bulkIds.split(/[\n,]+/).map(id => id.trim()).filter(id => id);
    if (!ids.length) return alert("Please enter at least one ID.");

    const docRef = doc(db, "event_participants", "approved_ids");
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const existingIds = docSnap.data()?.ids || [];
        const newIds = ids.map(id => Number(id)).filter(id => !existingIds.includes(id));
        if (newIds.length) {
          await updateDoc(docRef, { ids: arrayUnion(...newIds) });
          setItems(prev => [...prev, ...newIds.map(id => ({ id }))]);
          setBulkIds('');
          alert(`Successfully added ${newIds.length} new IDs.`);
        } else {
          alert("All IDs are already in the list.");
        }
      } else {
        const newIds = ids.map(id => Number(id));
        await setDoc(docRef, { ids: newIds });
        setItems(prev => [...prev, ...newIds.map(id => ({ id }))]);
        setBulkIds('');
        alert(`Successfully created approved_ids and added ${newIds.length} new IDs.`);
      }
    } catch (error) {
      console.error("Error adding IDs:", error);
      alert("Error adding IDs.");
    }
  };

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const collectionRef = collection(db, activeTab);
      const snapshot = await getDocs(collectionRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setLoading(false);
      data.forEach(item => item.image && getImageURL(item.image));
    } catch (err) {
      console.error("Error fetching items:", err);
      setLoading(false);
    }
  }, [activeTab, getImageURL]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (e) => {
    e.preventDefault();

    const updatedItemData = {
      ...itemData,
      type: activeTab === "events" ? itemData.type || "" : undefined
    };

    if (activeTab === "tutor") {
      if (!updatedItemData.name || !updatedItemData.mail || !updatedItemData.uid) {
        alert("Name, Email, and UID are required for tutors.");
        return;
      }
    }

    try {
      if (editingItem) {
        const itemRef = doc(db, activeTab, editingItem.id);
        const docSnap = await getDoc(itemRef);
        if (!docSnap.exists()) {
          alert("This item no longer exists. Please refresh and try again.");
          return;
        }
        await updateDoc(itemRef, updatedItemData);
        setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...updatedItemData } : item));
      } else if (activeTab === "event_participants") {
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
          alert("Created approved_ids and added the new ID.");
        }
      } else {
        const newDocRef = await addDoc(collection(db, activeTab), updatedItemData);
        setItems([...items, { id: newDocRef.id, ...updatedItemData }]);
      }

      resetForm();
    } catch (err) {
      console.error("Full error object:", err);
      alert(`Error: ${err.message}`);
      setError(`Error adding ${activeTab}`);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      console.log("Attempting to delete:", { id, activeTab });
      await deleteDoc(doc(db, activeTab, id));
      console.log("Successfully deleted:", id);
      setItems(items.filter(item => item.id !== id));
      fetchItems(); // Refresh in case data was stale
    } catch (err) {
      console.error("Error deleting item:", { id, activeTab, error: err });
      setError(`Error deleting ${activeTab}`);
    }
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setItemData(item || {
      name: '', description: '', day: '', month: '', year: '',
      type: '', image: '', website: '', mail: '', instagram: '', uid: '', subject: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setItemData({
      name: '', description: '', day: '', month: '', year: '',
      type: '', image: '', website: '', mail: '', instagram: '', uid: '', subject: ''
    });
    setShowModal(false);
  };

  const formatDate = (day, month, year) => (day && month && year) ? `${month} ${day}, ${year}` : '';

  const handleSubmit = (e) => {
    e.preventDefault();
    activeTab === "event_participants" && bulkIds ? handleBulkAdd(e) : handleAddItem(e);
  };

  return (
    <Container className="position-relative">
      <h1 className="text-center my-4">Manage Events & Clubs</h1>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab}>
          <Nav.Item><Nav.Link eventKey="events">Events</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="clubs">Clubs</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="FineArts">FineArts</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="athletics">Athletics</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="tutor">Tutors</Nav.Link></Nav.Item>
          <Nav.Item><Nav.Link eventKey="event_participants">Id List</Nav.Link></Nav.Item>
        </Nav>
        <Button variant="success" onClick={() => handleOpenModal()}>Add Item</Button>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <div className="text-center text-danger">{error}</div>
      ) : (
        <Row>
          {items.map(item => (
            <Col key={item.id} md={4} className="mb-4">
              <Card className="shadow-sm h-100">
                {item.image && imageUrls[item.image] && (
                  <Card.Img variant="top" src={imageUrls[item.image]} alt={item.name} style={{ height: '200px', objectFit: 'cover' }} />
                )}
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{item.name || item.id}</Card.Title>
                  {activeTab !== 'event_participants' && (
                    <>
                      <Card.Text>{item.description}</Card.Text>
                      {activeTab !== 'tutor' && (
                        <>
                          <Card.Text><strong>{formatDate(item.day, item.month, item.year)}</strong></Card.Text>
                          <Card.Text>{item.website && <a href={item.website} target="_blank" rel="noopener noreferrer">Visit Website</a>}</Card.Text>
                        </>
                      )}
                      {activeTab === 'events' && item.type && <Card.Text><strong>Type:</strong> {item.type}</Card.Text>}
                      {item.mail && <Card.Text><strong>Contact:</strong> {item.mail}</Card.Text>}
                      {activeTab === 'tutor' && item.subject && <Card.Text><strong>Subject:</strong> {item.subject}</Card.Text>}
                    </>
                  )}
                  <div className="mt-auto d-flex justify-content-between">
                    <Button variant="warning" className="btn-sm" onClick={() => handleOpenModal(item)}>Edit</Button>
                    <Button variant="danger" className="btn-sm" onClick={() => handleDeleteItem(item.id)}>Delete</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={resetForm}>
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Edit Item' : 'Add New Item'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {activeTab === "event_participants" ? (
              <Form.Group controlId="formBulkIds">
                <Form.Label>Bulk IDs</Form.Label>
                <Form.Control as="textarea" rows={3} value={bulkIds} onChange={handleBulkIdsChange} />
              </Form.Group>
            ) : (
              <>
                <Form.Group controlId="formName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" name="name" value={itemData.name || ''} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="formDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} name="description" value={itemData.description || ''} onChange={handleChange} />
                </Form.Group>
                {activeTab === "events" && (
                  <Form.Group controlId="formType">
                    <Form.Label>Type</Form.Label>
                    <Form.Control type="text" name="type" value={itemData.type || ''} onChange={handleChange} placeholder="e.g., volunteer, school" />
                  </Form.Group>
                )}
                {activeTab !== 'tutor' && (
                  <>
                    <Form.Group controlId="formDate">
                      <Form.Label>Date</Form.Label>
                      <Row>
                        <Col><Form.Control type="number" name="day" value={itemData.day || ''} onChange={handleChange} placeholder="Day" /></Col>
                        <Col><Form.Control type="text" name="month" value={itemData.month || ''} onChange={handleChange} placeholder="Month" /></Col>
                        <Col><Form.Control type="number" name="year" value={itemData.year || ''} onChange={handleChange} placeholder="Year" /></Col>
                      </Row>
                    </Form.Group>
                    <Form.Group controlId="formWebsite">
                      <Form.Label>Website</Form.Label>
                      <Form.Control type="text" name="website" value={itemData.website || ''} onChange={handleChange} />
                    </Form.Group>
                  </>
                )}
                {activeTab === 'tutor' && (
                  <>
                    <Form.Group controlId="formSubject">
                      <Form.Label>Subject</Form.Label>
                      <Form.Control type="text" name="subject" value={itemData.subject || ''} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group controlId="formUid">
                      <Form.Label>User ID (UID)</Form.Label>
                      <Form.Control type="text" name="uid" value={itemData.uid || ''} onChange={handleChange} />
                    </Form.Group>
                  </>
                )}
                <Form.Group controlId="formImage">
                  <Form.Label>Image URL</Form.Label>
                  <Form.Control type="text" name="image" value={itemData.image || ''} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="formMail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="text" name="mail" value={itemData.mail || ''} onChange={handleChange} />
                </Form.Group>
                <Form.Group controlId="formInstagram">
                  <Form.Label>Instagram</Form.Label>
                  <Form.Control type="text" name="instagram" value={itemData.instagram || ''} onChange={handleChange} />
                </Form.Group>
              </>
            )}
            <Button variant="primary" type="submit" className="mt-3 w-100">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default EventsClubsPage;
