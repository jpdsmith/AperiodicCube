import { onLoad, slicePlus, sliceMinus, toggleCube, updateState, resize, renderSequence } from './boxes.js';

$(document).ready(function() {
  const initialSequence = onLoad();
  $('#sequence').val(initialSequence);

  $('#minusbtn').click(function() {
    sliceMinus();
  });
  $('#plusbtn').click(function() {
    slicePlus();
  });


  $('#small').click(function() {
    window.location.href = "/#lim=5,sl=2";
    window.location.reload();
  });
  $('#medium').click(function() {
    window.location.href = "/#lim=16,sl=13";
    window.location.reload();
  });
  $('#large').click(function() {
    window.location.href = "/#lim=45,sl=42";
    window.location.reload();
  });
  $('#xl').click(function() {
    window.location.href = "/#lim=121,sl=118";
    window.location.reload();
  });

  $('#checkboxEven').change(function() {
    updateState((state) => { state.showEven = $(this).prop('checked') });
  })
  $('#checkboxOdd').change(function() {
    updateState((state) => { state.showOdd = $(this).prop('checked') });
  })
  $('#checkboxX').change(function() {
    updateState((state) => { state.showX = $(this).prop('checked') });
  })
  $('#checkboxY').change(function() {
    updateState((state) => { state.showY = $(this).prop('checked') });
  })
  $('#checkboxZ').change(function() {
    updateState((state) => { state.showZ = $(this).prop('checked') });
  })
  $('#checkboxXyzAsCubes').change(function() {
    updateState((state) => { state.showXyzAsCubes = $(this).prop('checked') });
  })
  $('#checkboxDiagonal').change(function() {
    updateState((state) => { state.showDiagonal = $(this).prop('checked') });
  })
  $('#checkboxLowerDiagonal').change(function() {
    updateState((state) => { state.showLowerDiagonal = $(this).prop('checked') });
  });
  $('#checkboxNear').change(function() {
    updateState((state) => { state.showNear = $(this).prop('checked') });
  });
  $('#checkboxFar').change(function() {
    updateState((state) => { state.showFar = $(this).prop('checked') });
  });


  $('#sequence').keydown(function(event) {
    let txt = $('#sequence').val();
    const sequence = txt.replace(/[^01]/g, '');
    $('#sequence').val(sequence);
    if (event.key == 'Enter') {
      renderSequence(sequence);
    }
  });

  $(document).keydown(function(e) {
    switch (e.which) {
      case 40:
        sliceMinus();
        break;

      case 38:
        slicePlus();
        break;

      default: return;
    }
    e.preventDefault();
  });

});

$(window).resize(function() {
  resize();
});