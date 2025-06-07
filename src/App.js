import React, { useEffect, useState } from 'react';
import {
  db,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Modal,
  Form,
} from 'react-bootstrap';

const tabs = [
  { key: 'events', label: 'Events' },
  { key: 'event_participants', label: 'Event Participants' },
  { key: 'tutor', label: 'Tutors' },
  { key: 'clubs', label: 'Clubs' },
  { key: 'FineArts', label: 'Fine Arts' },
  { key: 'athletics', label: 'Athletics' },
];

function App() {
  const [activeTab, setActiveTab] = useState('events');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemData, setItemData] = useState({});
  const [bulkIds, setBulkIds] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const colRef = collection(db, activeTab);
        const snapshot = await getDocs(colRef);
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setItems(docs);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };
    fetchItems();
  }, [activeTab]);

  const handleShowModal = () => {
    setEditingItem(null);
    setItemData({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setItemData({});
    setBulkIds('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItemData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBulkIdsChange = (e) => {
    setBulkIds(e.target.value);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);

    // Normalize fields for tutor, since it uses some different names
    if (activeTab === 'tutor') {
      setItemData({
        name: item.name || '',
        description: item.desc || '',
        image: item.img || '',
        subject: item.subject || '',
        tags: item.tags || '',
        mail: item.email || item.mail || '',
        instagram: item.instagram || '',
        website: item.website || '',
      });
    } else if (activeTab === 'event_participants') {
      // event_participants mostly have id only
      setItemData({ id: item.id });
    } else {
      setItemData({
        name: item.name || '',
        description: item.description || '',
        day: item.day || '',
        month: item.month || '',
        year: item.year || '',
        type: item.type || '',
        image: item.image || '',
        website: item.website || '',
        mail: item.mail || '',
        instagram: item.instagram || '',
      });
    }
    setShowModal(true);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteDoc(doc(db, activeTab, id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (activeTab === 'event_participants') {
        // Bulk add logic for event_participants
        const idsArray = bulkIds
          .split('\n')
          .map((id) => id.trim())
          .filter((id) => id.length > 0);
        for (const id of idsArray) {
          await addDoc(collection(db, activeTab), { id });
        }
        setBulkIds('');
      } else if (activeTab === 'tutor') {
        const dataToSave = {
          name: itemData.name || '',
          desc: itemData.description || '',
          img: itemData.image || '',
          subject: itemData.subject || '',
          tags: itemData.tags || '',
          email: itemData.mail || '',
          instagram: itemData.instagram || '',
          website: itemData.website || '',
        };
        if (editingItem) {
          await updateDoc(doc(db, activeTab, editingItem.id), dataToSave);
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id ? { ...item, ...dataToSave } : item
            )
          );
        } else {
          const docRef = await addDoc(collection(db, activeTab), dataToSave);
          setItems((prev) => [...prev, { id: docRef.id, ...dataToSave }]);
        }
      } 
      else if (activeTab === 'events') {
        const dataToSave = {
          name: itemData.name || '',
          description: itemData.description || '',
          day: itemData.day || '',
          month: itemData.month || '',
          year: itemData.year || '',
          type: itemData.type || '',
          image: itemData.image || '',
          website: itemData.website || '',
          mail: itemData.mail || '',
          instagram: itemData.instagram || '',
        };
        if (editingItem) {
          await updateDoc(doc(db, activeTab, editingItem.id), dataToSave);
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id ? { ...item, ...dataToSave } : item
            )
          );
        } else {
          const docRef = await addDoc(collection(db, activeTab), dataToSave);
          setItems((prev) => [...prev, { id: docRef.id, ...dataToSave }]);
        }
      }
      else {
        // For clubs, fine_arts, athletics — assume same structure
        const dataToSave = {
          name: itemData.name || '',
          description: itemData.description || '',
          type: itemData.type || '',
          image: itemData.image || '',
          website: itemData.website || '',
          mail: itemData.mail || '',
          instagram: itemData.instagram || '',
        };
        if (editingItem) {
          await updateDoc(doc(db, activeTab, editingItem.id), dataToSave);
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id ? { ...item, ...dataToSave } : item
            )
          );
        } else {
          const docRef = await addDoc(collection(db, activeTab), dataToSave);
          setItems((prev) => [...prev, { id: docRef.id, ...dataToSave }]);
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error adding/updating item:', error);
    }
  };

  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          {tabs.map(({ key, label }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab(key)}
              className="me-2 mb-2"
            >
              {label}
            </Button>
          ))}
        </Col>
        <Col className="text-end">
          <Button onClick={handleShowModal}>Add Item</Button>
        </Col>
      </Row>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Row>
          {items.length === 0 && (
            <Col>
              <p>No items found.</p>
            </Col>
          )}
          {items.map((item) => (
            <Col md={4} key={item.id} className="mb-3">
              <Card>
                {(activeTab === 'tutor' || activeTab === 'clubs' || activeTab === 'FineArts' || activeTab === 'athletics' || activeTab === 'events') ? (
                  <>
                    {(item.img || item.image) && (
                      <Card.Img
                        variant="top"
                        src={item.img || item.image}
                        alt={item.name}
                      />
                    )}
                    <Card.Body>
                      <Card.Title>{item.name}</Card.Title>
                      <Card.Text>{item.desc || item.description}</Card.Text>
                      {(activeTab === 'tutor') && (
                        <>
                          <Card.Text>
                            <strong>Subject:</strong> {item.subject}
                          </Card.Text>
                          <Card.Text>
                            <strong>Tags:</strong> {item.tags}
                          </Card.Text>
                          <Card.Text>
                            <strong>Email:</strong> {item.email}
                          </Card.Text>
                        </>
                      )}
                      {(activeTab === 'event') && (
                        <>
                          <Card.Text>
                            Date: {item.month} {item.day}, {item.year}
                          </Card.Text>
                          <Card.Text>Type: {item.type}</Card.Text>
                          <Card.Text>Email: {item.mail}</Card.Text>
                        </>
                      )}
                      {(activeTab === 'FineArts' || activeTab === 'athletics' || activeTab === 'clubs') && (
                        <>
                          
                          <Card.Text>Type: {item.type}</Card.Text>
                          <Card.Text>Email: {item.mail}</Card.Text>
                        </>
                      )}
                      <Card.Text>Instagram: {item.instagram}</Card.Text>
                      <Card.Text>Website: {item.website}</Card.Text>
                    </Card.Body>
                  </>
                ) : activeTab === 'event_participants' ? (
                  <Card.Body>
                    <Card.Title>{item.id || 'No ID'}</Card.Title>
                  </Card.Body>
                ) : null}
                <Card.Footer className="d-flex justify-content-between">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={() => handleEditItem(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Edit Item' : 'Add Item'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {activeTab === 'event_participants' ? (
              <Form.Group controlId="formBulkIds">
                <Form.Label>Bulk IDs</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={bulkIds}
                  onChange={handleBulkIdsChange}
                  placeholder="Enter one ID per line"
                />
              </Form.Group>
            ) : activeTab === 'tutor' ? (
              <>
                <Form.Group controlId="formName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={itemData.name || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={itemData.description || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formImage">
                  <Form.Label>Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="image"
                    value={itemData.image || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formSubject">
                  <Form.Label>Subjects</Form.Label>
                  <Form.Control
                    type="text"
                    name="subject"
                    value={itemData.subject || ''}
                    onChange={handleChange}
                    placeholder="e.g., Math, Physics"
                  />
                </Form.Group>

                <Form.Group controlId="formTags">
                  <Form.Label>Tags (comma-separated)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={itemData.tags || ''}
                    onChange={handleChange}
                    placeholder="e.g., math, sat, physics"
                  />
                </Form.Group>

                <Form.Group controlId="formMail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="mail"
                    value={itemData.mail || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formInstagram">
                  <Form.Label>Instagram</Form.Label>
                  <Form.Control
                    type="text"
                    name="instagram"
                    value={itemData.instagram || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formWebsite">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={itemData.website || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </>
            ) : activeTab === 'events' ? (
              <>
                <Form.Group controlId="formName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={itemData.name || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={itemData.description || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formDate">
                  <Form.Label>Date</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="number"
                        name="day"
                        value={itemData.day || ''}
                        onChange={handleChange}
                        placeholder="Day"
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="text"
                        name="month"
                        value={itemData.month || ''}
                        onChange={handleChange}
                        placeholder="Month"
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        name="year"
                        value={itemData.year || ''}
                        onChange={handleChange}
                        placeholder="Year"
                      />
                    </Col>
                  </Row>
                </Form.Group>

                <Form.Group controlId="formType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={itemData.type || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formImage">
                  <Form.Label>Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="image"
                    value={itemData.image || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formWebsite">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={itemData.website || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formMail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="mail"
                    value={itemData.mail || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formInstagram">
                  <Form.Label>Instagram</Form.Label>
                  <Form.Control
                    type="text"
                    name="instagram"
                    value={itemData.instagram || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </>
            )
          : (
              <>
                <Form.Group controlId="formName">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={itemData.name || ''}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="formDescription">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={itemData.description || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                

                <Form.Group controlId="formType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={itemData.type || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formImage">
                  <Form.Label>Image URL</Form.Label>
                  <Form.Control
                    type="text"
                    name="image"
                    value={itemData.image || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formWebsite">
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="text"
                    name="website"
                    value={itemData.website || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formMail">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="mail"
                    value={itemData.mail || ''}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="formInstagram">
                  <Form.Label>Instagram</Form.Label>
                  <Form.Control
                    type="text"
                    name="instagram"
                    value={itemData.instagram || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </>
            )}
            <Button variant="primary" type="submit" className="mt-3">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default App;
