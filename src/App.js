import React, { useEffect, useState } from 'react';
import { db, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Spinner, Form, Modal, Nav } from 'react-bootstrap';

const EventsClubsPage = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemData, setItemData] = useState({
    name: '',
    description: '',
    day: '',
    month: '',
    year: '',
    type: '',
    image: '',
    website: '',
    mail: '',
    instagram: ''
  });
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const collectionRef = collection(db, activeTab);
      const snapshot = await getDocs(collectionRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
      setLoading(false);
    } catch (err) {
      setError(`Error fetching ${activeTab}`);
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const newDocRef = await addDoc(collection(db, activeTab), itemData);
      setItems([...items, { id: newDocRef.id, ...itemData }]);
      resetForm();
    } catch (err) {
      setError(`Error adding ${activeTab}`);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, activeTab, id));
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      setError(`Error deleting ${activeTab}`);
    }
  };

  const handleUpdateItem = async (e, id) => {
    e.preventDefault();
    try {
      const itemRef = doc(db, activeTab, id);
      await updateDoc(itemRef, itemData);
      setItems(items.map(item => (item.id === id ? { ...item, ...itemData } : item)));
      resetForm();
    } catch (err) {
      setError(`Error updating ${activeTab}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setItemData(item || {
      name: '', description: '', day: '', month: '', year: '',
      type: '', image: '', website: '', mail: '', instagram: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setItemData({
      name: '', description: '', day: '', month: '', year: '',
      type: '', image: '', website: '', mail: '', instagram: ''
    });
    setShowModal(false);
  };

  const formatDate = (day, month, year) => (day && month && year) ? `${month} ${day}, ${year}` : 'Date not available';

  return (
    <Container className="position-relative">
      <h1 className="text-center my-4">Manage Events & Clubs</h1>
      <Nav variant="tabs" activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="events">Events</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="clubs">Clubs</Nav.Link>
        </Nav.Item>
      </Nav>

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
              <Card className="shadow-sm">
                {item.image && item.image !== 'Na' && <Card.Img variant="top" src={item.image} alt={item.name} />}
                <Card.Body>
                  <Card.Title>{item.name}</Card.Title>
                  <Card.Text>{item.description}</Card.Text>
                  <Card.Text><strong>{formatDate(item.day, item.month, item.year)}</strong></Card.Text>
                  <Card.Text>
                    {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer">Visit Website</a>}
                    {item.mail && <div><strong>Contact:</strong> {item.mail}</div>}
                  </Card.Text>
                  <div className="d-flex justify-content-between">
                    <Button variant="warning" className="mx-2" onClick={() => handleOpenModal(item)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDeleteItem(item.id)}>Delete</Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      {/* Add New button positioned at top-right */}
      <Button variant="success" className="position-absolute top-0 end-0 m-3" onClick={() => handleOpenModal()}>Add New {activeTab.slice(0, -1)}</Button>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={editingItem ? (e) => handleUpdateItem(e, editingItem.id) : handleAddItem}>
            {Object.keys(itemData).map((key) => (
              <Form.Group className="mb-3" key={key}>
                <Form.Label>{key.charAt(0).toUpperCase() + key.slice(1)}</Form.Label>
                <Form.Control type="text" name={key} value={itemData[key]} onChange={handleChange} required />
              </Form.Group>
            ))}
            <Button variant="primary" type="submit">{editingItem ? "Update" : "Add"}</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default EventsClubsPage;
